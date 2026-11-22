#!/usr/bin/env bash
# Cast relink: re-resolve UPPERCASE-role anime_character links (see README.md).
# LOCAL DATABASE ONLY. Usage:
#   bash scripts/db/cast-relink/run.sh stage --anilist-csv PATH --offline-db PATH
#   bash scripts/db/cast-relink/run.sh audit   (dry run: rebuilds cast_relink.audit only)
#   bash scripts/db/cast-relink/run.sh test
#   LOCAL_DATABASE_URL falls back to DATABASE_URL, then to POSTGRES_* on localhost.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCHEMA='cast_relink'
ANILIST_CSV=''
OFFLINE_DB=''

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

run_tests() {
  SCHEMA='cast_relink_test'
  sql -c "DROP SCHEMA IF EXISTS ${SCHEMA} CASCADE"
  trap 'sql -c "DROP SCHEMA IF EXISTS cast_relink_test CASCADE" || true' EXIT
  ANILIST_CSV="$HERE/test/fixtures/anilist.csv"
  OFFLINE_DB="$HERE/test/fixtures/offline-db.jsonl"
  stage >/dev/null
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
    *) die "unknown arg: $1" ;;
  esac
done

assert_local
case "$COMMAND" in
  stage) stage ;;
  audit) audit ;;
  test) run_tests ;;
  *) die 'usage: run.sh <stage|audit|test> [--anilist-csv PATH] [--offline-db PATH]' ;;
esac
