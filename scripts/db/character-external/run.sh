#!/usr/bin/env bash
# character_external backfill and twin merge (see README.md). LOCAL DATABASE ONLY.
# Usage:
#   bash scripts/db/character-external/run.sh backfill      (ONE tx; refused if applied)
#   bash scripts/db/character-external/run.sh merge-twins   (ONE tx; needs backfill)
#   bash scripts/db/character-external/run.sh rollback      (ONE tx; exact undo of both)
#   bash scripts/db/character-external/run.sh test          (throwaway test schema)
#   LOCAL_DATABASE_URL falls back to DATABASE_URL, then to POSTGRES_* on localhost.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCHEMA='character_external_ops'

build_local_url() {
  if [[ -z "${POSTGRES_USER:-}" || -z "${POSTGRES_PASSWORD:-}" || -z "${POSTGRES_DB:-}" ]]; then
    return 0
  fi
  echo "postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:5432/${POSTGRES_DB}"
}
DB_URL="${LOCAL_DATABASE_URL:-${DATABASE_URL:-$(build_local_url)}}"

die() { echo "character-external: $*" >&2; exit 1; }

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

prepare() { sql -c "CREATE SCHEMA IF NOT EXISTS ${SCHEMA}" -f "$HERE/sql/01-log.sql"; }

backfill() {
  prepare
  sql -f "$HERE/sql/02-backfill.sql"
  sql -c "SELECT 'backfilled' AS action, count(*) FROM backfilled
          UNION ALL SELECT 'conflict ' || reason, count(*) FROM conflicts GROUP BY 1
          UNION ALL SELECT 'external with anilist_id', count(*) FROM character_external
            WHERE anilist_id IS NOT NULL ORDER BY 1"
}

merge_twins() {
  prepare
  sql -f "$HERE/sql/03-merge-twins.sql"
  sql -c "SELECT 'twins merged' AS action, count(*) FROM merge_pairs
          UNION ALL SELECT 'deleted characters', count(*) FROM deleted_characters
          UNION ALL SELECT 'deleted externals', count(*) FROM deleted_externals
          UNION ALL SELECT 'moved anime_character', count(*) FROM moved_anime_character
          UNION ALL SELECT 'skipped anime_character', count(*) FROM skipped_anime_character
          UNION ALL SELECT 'moved manga_character', count(*) FROM moved_manga_character
          UNION ALL SELECT 'skipped manga_character', count(*) FROM skipped_manga_character
          UNION ALL SELECT 'moved character_voice_actor', count(*) FROM moved_character_voice_actor
          UNION ALL SELECT 'skipped character_voice_actor', count(*) FROM skipped_character_voice_actor
          UNION ALL SELECT 'moved character_nickname', count(*) FROM moved_character_nickname
          UNION ALL SELECT 'skipped character_nickname', count(*) FROM skipped_character_nickname
          UNION ALL SELECT 'moved character_media', count(*) FROM moved_character_media
          UNION ALL SELECT 'skipped character_media', count(*) FROM skipped_character_media"
}

rollback() {
  prepare
  sql -f "$HERE/sql/04-rollback.sql"
  echo 'character-external: rolled back'
}

run_tests() {
  SCHEMA='character_external_test'
  sql -c "DROP SCHEMA IF EXISTS ${SCHEMA} CASCADE" -c "CREATE SCHEMA ${SCHEMA}"
  trap 'sql -c "DROP SCHEMA IF EXISTS character_external_test CASCADE" || true' EXIT
  local file
  for file in "$HERE"/test/*.test.sql; do
    sql -v cast_schema="${SCHEMA}" -f "$file"
    echo "ok - $(basename "$file")"
  done
}

COMMAND="${1:-}"
[[ $# -le 1 ]] || die "unexpected args: ${*:2}"

assert_local
case "$COMMAND" in
  backfill) backfill ;;
  merge-twins) merge_twins ;;
  rollback) rollback ;;
  test) run_tests ;;
  *) die 'usage: run.sh <backfill|merge-twins|rollback|test>' ;;
esac
