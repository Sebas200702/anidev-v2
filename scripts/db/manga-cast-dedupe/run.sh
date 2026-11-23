#!/usr/bin/env bash
# Manga cast dedupe: MAL (Title-case) vs AniList-import (UPPERCASE) manga_character
# duplicates (see README.md). LOCAL DATABASE ONLY. Usage:
#   bash scripts/db/manga-cast-dedupe/run.sh audit     (dry run: counts + examples)
#   bash scripts/db/manga-cast-dedupe/run.sh apply     (ONE tx; one logged batch)
#   bash scripts/db/manga-cast-dedupe/run.sh rollback  (ONE tx; exact undo of the last batch)
#   bash scripts/db/manga-cast-dedupe/run.sh test      (throwaway test schemas)
#   LOCAL_DATABASE_URL falls back to DATABASE_URL, then to POSTGRES_* on localhost.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# norm_name has a single definition, shared with the anime cast relink.
NORM_SQL="$HERE/../cast-relink/sql/01-staging.sql"
STAGING_SQL="$HERE/../manga-cast-relink/sql/01-staging.sql"
SCHEMA='manga_cast_dedupe'
RELINK_SCHEMA='manga_cast_relink'

build_local_url() {
  if [[ -z "${POSTGRES_USER:-}" || -z "${POSTGRES_PASSWORD:-}" || -z "${POSTGRES_DB:-}" ]]; then
    return 0
  fi
  echo "postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:5432/${POSTGRES_DB}"
}
DB_URL="${LOCAL_DATABASE_URL:-${DATABASE_URL:-$(build_local_url)}}"

die() { echo "manga-cast-dedupe: $*" >&2; exit 1; }

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
  psql "$DB_URL" -X -q -v ON_ERROR_STOP=1 -v relink_schema="${RELINK_SCHEMA}" \
    -c 'SET client_min_messages TO warning' \
    -c "SET search_path TO ${SCHEMA}, public" "$@"
}

prepare() { sql -c "CREATE SCHEMA IF NOT EXISTS ${SCHEMA}" -f "$HERE/sql/01-log.sql"; }

apply() {
  sql -f "$HERE/sql/04-apply.sql"
  sql -c "SELECT 'batch' AS action, max(batch_id) AS count FROM batches
    UNION ALL SELECT 'merged pairs', count(*) FROM merged_pairs
      WHERE batch_id = (SELECT max(batch_id) FROM batches)
    UNION ALL SELECT 'removed manga_character (' || reason || ')', count(*)
      FROM removed_links WHERE batch_id = (SELECT max(batch_id) FROM batches) GROUP BY 1
    UNION ALL SELECT 'moved manga_character', count(*) FROM moved_manga_character
      WHERE batch_id = (SELECT max(batch_id) FROM batches)
    UNION ALL SELECT 'skipped manga_character', count(*) FROM skipped_manga_character
      WHERE batch_id = (SELECT max(batch_id) FROM batches)
    UNION ALL SELECT 'moved anime_character', count(*) FROM moved_anime_character
      WHERE batch_id = (SELECT max(batch_id) FROM batches)
    UNION ALL SELECT 'deleted characters', count(*) FROM deleted_characters
      WHERE batch_id = (SELECT max(batch_id) FROM batches)
    UNION ALL SELECT 'updated externals', count(*) FROM updated_externals
      WHERE batch_id = (SELECT max(batch_id) FROM batches)"
}

run_tests() {
  SCHEMA='manga_cast_dedupe_test'
  RELINK_SCHEMA='manga_cast_dedupe_test_relink'
  sql -c "DROP SCHEMA IF EXISTS ${SCHEMA} CASCADE" \
    -c "DROP SCHEMA IF EXISTS ${RELINK_SCHEMA} CASCADE"
  trap 'sql -c "DROP SCHEMA IF EXISTS manga_cast_dedupe_test CASCADE" \
    -c "DROP SCHEMA IF EXISTS manga_cast_dedupe_test_relink CASCADE" || true' EXIT
  # The manga cast staging lives in its own schema, as manga_cast_relink does.
  local norm
  norm="$(awk '/^CREATE OR REPLACE FUNCTION norm_name/,/^\$\$;/' "$NORM_SQL")"
  [[ -n "$norm" ]] || die "norm_name not found in $NORM_SQL"
  psql "$DB_URL" -X -q -v ON_ERROR_STOP=1 -c 'SET client_min_messages TO warning' \
    -c "CREATE SCHEMA ${RELINK_SCHEMA}" -c "SET search_path TO ${RELINK_SCHEMA}, public" \
    -c "$norm" -f "$STAGING_SQL"
  prepare
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
  audit) prepare && sql -f "$HERE/sql/03-audit.sql" ;;
  apply) prepare && apply ;;
  rollback) prepare && sql -f "$HERE/sql/05-rollback.sql" && echo 'manga-cast-dedupe: last batch rolled back' ;;
  test) run_tests ;;
  *) die 'usage: run.sh <audit|apply|rollback|test>' ;;
esac
