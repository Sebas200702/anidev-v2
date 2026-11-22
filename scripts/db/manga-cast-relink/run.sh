#!/usr/bin/env bash
# Manga cast relink: re-resolve manga_character links against AniList manga casts
# (see README.md). LOCAL DATABASE ONLY. Usage:
#   bash scripts/db/manga-cast-relink/run.sh fetch-list --out-dir DIR  (manga ids + map)
#   bash scripts/db/manga-cast-relink/run.sh merge-api --api-jsonl PATH (staging only)
#   bash scripts/db/manga-cast-relink/run.sh audit      (dry run: audit + audit_add)
#   bash scripts/db/manga-cast-relink/run.sh apply      (audit + ONE-tx write)
#   bash scripts/db/manga-cast-relink/run.sh rollback   (ONE-tx exact undo)
#   bash scripts/db/manga-cast-relink/run.sh test       (throwaway test schema)
#   LOCAL_DATABASE_URL falls back to DATABASE_URL, then to POSTGRES_* on localhost.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# norm_name has a single definition, shared with the anime cast relink.
NORM_SQL="$HERE/../cast-relink/sql/01-staging.sql"
SCHEMA='manga_cast_relink'
API_JSONL=''
OUT_DIR=''

build_local_url() {
  if [[ -z "${POSTGRES_USER:-}" || -z "${POSTGRES_PASSWORD:-}" || -z "${POSTGRES_DB:-}" ]]; then
    return 0
  fi
  echo "postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:5432/${POSTGRES_DB}"
}
DB_URL="${LOCAL_DATABASE_URL:-${DATABASE_URL:-$(build_local_url)}}"

die() { echo "manga-cast-relink: $*" >&2; exit 1; }

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

# Schema, norm_name (copied verbatim from the cast-relink staging file), staging + logs.
prepare() {
  local norm
  norm="$(awk '/^CREATE OR REPLACE FUNCTION norm_name/,/^\$\$;/' "$NORM_SQL")"
  [[ -n "$norm" ]] || die "norm_name not found in $NORM_SQL"
  sql -c "CREATE SCHEMA IF NOT EXISTS ${SCHEMA}" -c "$norm" -f "$HERE/sql/01-staging.sql"
}

# DIR/manga-ids.txt: distinct manga ids of manga_character; DIR/manga-anilist-map.tsv:
# mal_id<TAB>anilist_id from manga_external_ids, for fetch-anilist.ts --type MANGA.
fetch_list() {
  [[ -n "$OUT_DIR" ]] || die 'missing --out-dir DIR'
  mkdir -p "$OUT_DIR"
  local ids='SELECT DISTINCT manga_id FROM manga_character'
  sql -A -t -c "${ids} ORDER BY 1" >"$OUT_DIR/manga-ids.txt"
  sql -A -t -F $'\t' -c "SELECT manga_id, anilist_id FROM manga_external_ids
    WHERE anilist_id IS NOT NULL AND manga_id IN (${ids}) ORDER BY 1" \
    >"$OUT_DIR/manga-anilist-map.tsv"
  echo "manga-cast-relink: $(wc -l <"$OUT_DIR/manga-ids.txt") manga ids, $(wc -l <"$OUT_DIR/manga-anilist-map.tsv") mapped"
}

# JSONL lines are loaded whole: \x01/\x02 never occur in JSON, so no CSV quoting applies.
load_api_raw() {
  [[ -f "$API_JSONL" ]] || die "missing --api-jsonl file: '$API_JSONL'"
  sql -c 'TRUNCATE api_raw RESTART IDENTITY' \
    -c "COPY api_raw (line) FROM STDIN WITH (FORMAT csv, QUOTE E'\\x01', DELIMITER E'\\x02')" <"$API_JSONL"
}

merge_api() {
  load_api_raw
  sql -f "$HERE/sql/02-merge-api.sql"
  sql -c 'SELECT status, count(*) AS mangas, sum(cast_size) AS characters
          FROM manga_cast_source GROUP BY 1 ORDER BY 1'
}

# Dry run: rebuilds audit + audit_add and prints the summary; no public table is written.
audit() {
  sql -f "$HERE/sql/03-audit.sql"
  sql -c 'SELECT decision, reason, count(*) AS pairs,
               count(*) FILTER (WHERE creates_character) AS creates_character
        FROM audit GROUP BY 1, 2 ORDER BY 1, 3 DESC' \
    -c "SELECT 'add' AS decision, count(*) AS links,
               count(DISTINCT target_character_id) FILTER (WHERE creates_character)
                 AS creates_character
        FROM audit_add"
}

apply() {
  audit
  sql -f "$HERE/sql/04-apply.sql"
  sql -c "SELECT 'removed (' || decision || '/' || reason || ')' AS action, count(*)
            FROM removed_links GROUP BY 1
          UNION ALL SELECT 'inserted (' || source || ')', count(*) FROM inserted_links GROUP BY 1
          UNION ALL SELECT 'created characters', count(*) FROM created_characters
          UNION ALL SELECT 'created media', count(*) FROM created_media ORDER BY 1"
}

run_tests() {
  SCHEMA='manga_cast_relink_test'
  sql -c "DROP SCHEMA IF EXISTS ${SCHEMA} CASCADE"
  trap 'sql -c "DROP SCHEMA IF EXISTS manga_cast_relink_test CASCADE" || true' EXIT
  prepare
  sql -f "$HERE/test/fixtures.sql"
  API_JSONL="$HERE/test/fixtures/manga-api.jsonl"
  load_api_raw # merged by test/01-merge-api.test.sql
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
    --api-jsonl) API_JSONL="$2"; shift 2 ;;
    --out-dir) OUT_DIR="$2"; shift 2 ;;
    *) die "unknown arg: $1" ;;
  esac
done

assert_local
case "$COMMAND" in
  fetch-list) fetch_list ;;
  merge-api) prepare && merge_api ;;
  audit) prepare && audit ;;
  apply) prepare && apply ;;
  rollback) prepare && sql -f "$HERE/sql/05-rollback.sql" && echo 'manga-cast-relink: batch rolled back' ;;
  test) run_tests ;;
  *) die 'usage: run.sh <fetch-list|merge-api|audit|apply|rollback|test> [--out-dir DIR]
  [--api-jsonl PATH]' ;;
esac
