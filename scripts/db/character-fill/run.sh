#!/usr/bin/env bash
# Character kanji + poster fill from the staged AniList casts (see README.md).
# LOCAL DATABASE ONLY. Usage:
#   bash scripts/db/character-fill/run.sh audit     (dry run: counts, writes nothing)
#   bash scripts/db/character-fill/run.sh apply     (ONE tx; refused while applied)
#   bash scripts/db/character-fill/run.sh rollback  (ONE tx; exact undo, empties logs)
#   bash scripts/db/character-fill/run.sh test      (throwaway test schema)
#   LOCAL_DATABASE_URL falls back to DATABASE_URL, then to POSTGRES_* on localhost.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCHEMA='character_fill'
# Staged AniList casts (either may be absent; a missing one is simply not read).
CAST_TABLE='cast_relink.anilist_cast'
MANGA_TABLE='manga_cast_relink.manga_cast'

build_local_url() {
  if [[ -z "${POSTGRES_USER:-}" || -z "${POSTGRES_PASSWORD:-}" || -z "${POSTGRES_DB:-}" ]]; then
    return 0
  fi
  echo "postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:5432/${POSTGRES_DB}"
}
DB_URL="${LOCAL_DATABASE_URL:-${DATABASE_URL:-$(build_local_url)}}"

die() { echo "character-fill: $*" >&2; exit 1; }

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
  psql "$DB_URL" -X -q -v ON_ERROR_STOP=1 -v cast_table="$CAST_TABLE" \
    -v manga_table="$MANGA_TABLE" -c 'SET client_min_messages TO warning' \
    -c "SET search_path TO ${SCHEMA}, public" "$@"
}

prepare() { sql -c "CREATE SCHEMA IF NOT EXISTS ${SCHEMA}" -f "$HERE/sql/01-log.sql"; }

apply() {
  prepare
  sql -f "$HERE/sql/04-apply.sql"
  sql -c "SELECT 'kanji filled' AS action, count(*) FROM kanji_updates
          UNION ALL SELECT 'kanji conflicts (skipped)', count(*) FROM kanji_conflicts
          UNION ALL SELECT 'posters inserted', count(*) FROM inserted_posters"
}

rollback() {
  prepare
  sql -f "$HERE/sql/05-rollback.sql"
  echo 'character-fill: rolled back'
}

run_tests() {
  SCHEMA='character_fill_test'
  CAST_TABLE='character_fill_test.anilist_cast'
  MANGA_TABLE='character_fill_test.manga_cast'
  sql -c "DROP SCHEMA IF EXISTS ${SCHEMA} CASCADE" -c "CREATE SCHEMA ${SCHEMA}"
  trap 'sql -c "DROP SCHEMA IF EXISTS character_fill_test CASCADE" || true' EXIT
  local file
  for file in "$HERE"/test/*.test.sql; do
    sql -f "$file"
    echo "ok - $(basename "$file")"
  done
}

COMMAND="${1:-}"
[[ $# -le 1 ]] || die "unexpected args: ${*:2}"

assert_local
case "$COMMAND" in
  audit) sql -f "$HERE/sql/03-audit.sql" ;;
  apply) apply ;;
  rollback) rollback ;;
  test) run_tests ;;
  *) die 'usage: run.sh <audit|apply|rollback|test>' ;;
esac
