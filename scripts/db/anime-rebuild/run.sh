#!/usr/bin/env bash
# Anime rebuild: AniList relations, empty-field fill and source-majority corrections from
# the staged AniList CSV + anime-offline-database (see README.md).
# LOCAL DATABASE ONLY. Usage:
#   bash scripts/db/anime-rebuild/run.sh audit     (dry run: counts + examples, writes nothing)
#   bash scripts/db/anime-rebuild/run.sh apply     (ONE tx; refused while applied)
#   bash scripts/db/anime-rebuild/run.sh rollback  (ONE tx; exact undo, empties logs)
#   bash scripts/db/anime-rebuild/run.sh test      (throwaway test schema)
#   LOCAL_DATABASE_URL falls back to DATABASE_URL, then to POSTGRES_* on localhost.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCHEMA='anime_rebuild'
# Raw sources staged by scripts/db/cast-relink (run.sh stage).
ANILIST_RAW='cast_relink.anilist_raw'
OFFLINE_RAW='cast_relink.offline_db_raw'

build_local_url() {
  if [[ -z "${POSTGRES_USER:-}" || -z "${POSTGRES_PASSWORD:-}" || -z "${POSTGRES_DB:-}" ]]; then
    return 0
  fi
  echo "postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:5432/${POSTGRES_DB}"
}
DB_URL="${LOCAL_DATABASE_URL:-${DATABASE_URL:-$(build_local_url)}}"

die() { echo "anime-rebuild: $*" >&2; exit 1; }

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
  psql "$DB_URL" -X -q -v ON_ERROR_STOP=1 -v anilist_raw="$ANILIST_RAW" \
    -v offline_raw="$OFFLINE_RAW" -c 'SET client_min_messages TO warning' \
    -c "SET search_path TO ${SCHEMA}, public" "$@"
}

prepare() { sql -c "CREATE SCHEMA IF NOT EXISTS ${SCHEMA}" -f "$HERE/sql/01-log.sql"; }

# Dry run: the plan lives in TEMP tables; nothing persistent is created or written.
audit() { sql -P pager=off -f "$HERE/sql/05-audit.sql"; }

apply() {
  prepare
  sql -f "$HERE/sql/06-apply.sql"
  sql -c "SELECT action || ' ' || field AS action, count(*) FROM field_updates GROUP BY 1
          UNION ALL SELECT 'relation inserted', count(*) FROM inserted_relations ORDER BY 1"
}

rollback() {
  prepare
  sql -f "$HERE/sql/07-rollback.sql"
  echo 'anime-rebuild: rolled back'
}

run_tests() {
  SCHEMA='anime_rebuild_test'
  ANILIST_RAW='anime_rebuild_test.anilist_raw'
  OFFLINE_RAW='anime_rebuild_test.offline_db_raw'
  sql -c "DROP SCHEMA IF EXISTS ${SCHEMA} CASCADE" -c "CREATE SCHEMA ${SCHEMA}"
  trap 'sql -c "DROP SCHEMA IF EXISTS anime_rebuild_test CASCADE" || true' EXIT
  local file
  # One session: the helpers live in pg_temp and the tests share the fixture state.
  local args=()
  for file in "$HERE"/test/*.test.sql; do
    args+=(-f "$file" -c "\\echo ok - $(basename "$file")")
  done
  sql "${args[@]}"
}

COMMAND="${1:-}"
[[ $# -le 1 ]] || die "unexpected args: ${*:2}"

assert_local
case "$COMMAND" in
  audit) audit ;;
  apply) apply ;;
  rollback) rollback ;;
  test) run_tests ;;
  *) die 'usage: run.sh <audit|apply|rollback|test>' ;;
esac
