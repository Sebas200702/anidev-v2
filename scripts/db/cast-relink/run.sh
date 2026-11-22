#!/usr/bin/env bash
# Cast relink: re-resolve UPPERCASE-role anime_character links (see README.md).
# LOCAL DATABASE ONLY. Usage:
#   bash scripts/db/cast-relink/run.sh stage --anilist-csv PATH --offline-db PATH
#   bash scripts/db/cast-relink/run.sh audit   (dry run: rebuilds cast_relink.audit only)
#   bash scripts/db/cast-relink/run.sh fetch-list --out-dir DIR   (pending-api ids + map)
#   bash scripts/db/cast-relink/run.sh merge-api --api-jsonl PATH (then re-run audit)
#   bash scripts/db/cast-relink/run.sh apply|rollback (audit + ONE-tx write | exact undo)
#   bash scripts/db/cast-relink/run.sh test
#   LOCAL_DATABASE_URL falls back to DATABASE_URL, then to POSTGRES_* on localhost.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCHEMA='cast_relink'
ANILIST_CSV=''
OFFLINE_DB=''
API_JSONL=''
OUT_DIR=''

build_local_url() {
  if [[ -z "${POSTGRES_USER:-}" || -z "${POSTGRES_PASSWORD:-}" || -z "${POSTGRES_DB:-}" ]]; then
    return 0
  fi
  echo "postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:5432/${POSTGRES_DB}"
}
DB_URL="${LOCAL_DATABASE_URL:-${DATABASE_URL:-$(build_local_url)}}"

die() { echo "cast-relink: $*" >&2; exit 1; }

assert_local() {
  [[ -n "$DB_URL" ]] || die 'no database URL (set LOCAL_DATABASE_URL)'
  local host
  host="$(echo "$DB_URL" | sed -E 's#^[a-z]+://([^@/]*@)?(\[[^]]*\]|[^:/?]*).*#\2#')"
  case "$host" in
    localhost | 127.0.0.1 | '[::1]') ;;
    *) die "refusing non-local database host '$host' (production is applied by the maintainer)" ;;
  esac
}

# psql in $SCHEMA first, public second; extra args are passed through.
sql() {
  psql "$DB_URL" -X -q -v ON_ERROR_STOP=1 -c 'SET client_min_messages TO warning' \
    -c "SET search_path TO ${SCHEMA}, public" "$@"
}

stage() {
  [[ -f "$ANILIST_CSV" ]] || die "missing --anilist-csv file: '$ANILIST_CSV'"
  [[ -f "$OFFLINE_DB" ]] || die "missing --offline-db file: '$OFFLINE_DB'"
  sql -c "CREATE SCHEMA IF NOT EXISTS ${SCHEMA}" -f "$HERE/sql/01-staging.sql"
  sql -c 'TRUNCATE anilist_raw' \
    -c 'COPY anilist_raw FROM STDIN WITH (FORMAT csv, HEADER true)' <"$ANILIST_CSV"
  sql -c 'TRUNCATE offline_db_raw' \
    -c "COPY offline_db_raw (line) FROM STDIN WITH (FORMAT csv, QUOTE E'\\x01', DELIMITER E'\\x02')" <"$OFFLINE_DB"
  sql -f "$HERE/sql/02-load-sources.sql"
  echo "cast-relink: staged sources into schema ${SCHEMA}"
}

# Dry run: (re)builds the audit table and prints the summary; no public table is written.
audit() {
  sql -f "$HERE/sql/03-audit.sql"
  sql -c 'SELECT decision, count(*) AS pairs FROM audit GROUP BY 1 ORDER BY 2 DESC' \
    -c 'SELECT decision, reason, count(*) AS pairs,
               count(*) FILTER (WHERE creates_character) AS creates_character
        FROM audit GROUP BY 1, 2 ORDER BY 1, 3 DESC' \
    -c 'SELECT a.character_id, c.name, a.roles, a.decision, a.reason,
               a.anilist_character_id, a.target_character_id, a.creates_character
        FROM audit a LEFT JOIN "character" c ON c.mal_id = a.character_id
        WHERE a.anime_id = 57810 ORDER BY a.decision, a.character_id'
}

# Writes DIR/pending-ids.txt (anime ids of pending-api audit rows) and DIR/anilist-map.tsv
# (mal_id<TAB>anilist_id for those ids) for fetch-anilist.ts.
fetch_list() {
  [[ -n "$OUT_DIR" ]] || die 'missing --out-dir DIR'
  mkdir -p "$OUT_DIR"
  local pending="SELECT DISTINCT anime_id FROM audit WHERE decision = 'pending-api'"
  sql -A -t -c "${pending} ORDER BY 1" >"$OUT_DIR/pending-ids.txt"
  sql -A -t -F $'\t' -c "SELECT mal_id, anilist_id FROM anime_anilist_map
    WHERE mal_id IN (${pending}) ORDER BY 1" >"$OUT_DIR/anilist-map.tsv"
  echo "cast-relink: $(wc -l <"$OUT_DIR/pending-ids.txt") ids, $(wc -l <"$OUT_DIR/anilist-map.tsv") mapped"
}

# JSONL lines are loaded whole: \x01/\x02 never occur in JSON, so no CSV quoting applies.
load_api_raw() {
  [[ -f "$API_JSONL" ]] || die "missing --api-jsonl file: '$API_JSONL'"
  sql -c "CREATE SCHEMA IF NOT EXISTS ${SCHEMA}" -f "$HERE/sql/01-staging.sql"
  sql -c 'TRUNCATE anilist_api_raw RESTART IDENTITY' \
    -c "COPY anilist_api_raw (line) FROM STDIN WITH (FORMAT csv, QUOTE E'\\x01', DELIMITER E'\\x02')" <"$API_JSONL"
}

merge_api() {
  load_api_raw
  sql -f "$HERE/sql/04-merge-api.sql"
  sql -c "SELECT source, count(*) AS animes, sum(cast_size) AS characters
          FROM anilist_cast_source GROUP BY 1 ORDER BY 1"
}

# Writes public tables in one transaction; refused while a batch is not rolled back.
apply() {
  audit
  sql -f "$HERE/sql/05-apply.sql"
  sql -c "SELECT 'removed (' || decision || ')' AS action, count(*) FROM removed_links GROUP BY 1
          UNION ALL SELECT 'inserted links', count(*) FROM inserted_links
          UNION ALL SELECT 'created characters', count(*) FROM created_characters
          UNION ALL SELECT 'created media', count(*) FROM created_media
          UNION ALL SELECT 'anilist_id ' || status, count(*) FROM updated_characters GROUP BY 1
          UNION ALL SELECT 'untouched (' || decision || ')', count(*) FROM audit
            WHERE decision IN ('keep', 'pending-api') GROUP BY decision ORDER BY 1"
}

run_tests() {
  SCHEMA='cast_relink_test'
  sql -c "DROP SCHEMA IF EXISTS ${SCHEMA} CASCADE"
  trap 'sql -c "DROP SCHEMA IF EXISTS cast_relink_test CASCADE" || true' EXIT
  ANILIST_CSV="$HERE/test/fixtures/anilist.csv"
  OFFLINE_DB="$HERE/test/fixtures/offline-db.jsonl"
  stage >/dev/null
  API_JSONL="$HERE/test/fixtures/anilist-api.jsonl"
  load_api_raw # merged by test/03-merge-api.test.sql
  local file
  for file in "$HERE"/test/*.test.sql; do
    sql -f "$file"
    echo "ok - $(basename "$file")"
  done
}

COMMAND="${1:-}"
shift || true
while [[ $# -gt 0 ]]; do
  case "$1" in
    --anilist-csv) ANILIST_CSV="$2"; shift 2 ;;
    --offline-db) OFFLINE_DB="$2"; shift 2 ;;
    --api-jsonl) API_JSONL="$2"; shift 2 ;;
    --out-dir) OUT_DIR="$2"; shift 2 ;;
    *) die "unknown arg: $1" ;;
  esac
done

assert_local
case "$COMMAND" in
  stage) stage ;;
  audit) audit ;;
  fetch-list) fetch_list ;;
  merge-api) merge_api ;;
  apply) apply ;;
  rollback) sql -f "$HERE/sql/06-rollback.sql" && echo 'cast-relink: batch rolled back' ;;
  test) run_tests ;;
  *) die 'usage: run.sh <stage|audit|fetch-list|merge-api|apply|rollback|test> [--anilist-csv PATH]
  [--offline-db PATH] [--out-dir DIR] [--api-jsonl PATH]' ;;
esac
