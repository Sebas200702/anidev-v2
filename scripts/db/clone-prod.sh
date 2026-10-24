#!/usr/bin/env bash
# Clone production Postgres into the local dev DB for realistic testing.
# Reads prod, writes ONLY to local. Usage:
#   PROD_DATABASE_URL='postgres://...' bash scripts/db/clone-prod.sh [--dump-file PATH] [--dump-only|--restore-only] [--no-vacuum] [--data-only]
#   LOCAL_DATABASE_URL defaults to postgres://anidev:anidev@localhost:5432/anidev
#   --data-only: copy table data without touching schema (use when prod is behind
#   local migrations). Excludes the drizzle history schema.
set -euo pipefail

DUMP_FILE='/tmp/opencode/anidev-prod.dump'
MODE='all'
VACUUM=true
DATA_ONLY=false
LOCAL_DATABASE_URL="${LOCAL_DATABASE_URL:-${DATABASE_URL:-postgres://anidev:anidev@localhost:5432/anidev}}"
PROD_DATABASE_URL="${PROD_DATABASE_URL:-}"

while [ $# -gt 0 ]; do
  case "$1" in
    --dump-file) DUMP_FILE="$2"; shift 2 ;;
    --dump-only) MODE='dump'; shift ;;
    --restore-only) MODE='restore'; shift ;;
    --no-vacuum) VACUUM=false; shift ;;
    --data-only) DATA_ONLY=true; shift ;;
    *) echo "unknown arg: $1" >&2; exit 1 ;;
  esac
done

mask() {
  echo "$1" | sed -E 's#(://[^:/]+:)[^@]+@#\1***@#'
}

command -v pg_dump >/dev/null || { echo 'missing pg_dump' >&2; exit 1; }
command -v pg_restore >/dev/null || { echo 'missing pg_restore' >&2; exit 1; }
command -v psql >/dev/null || { echo 'missing psql' >&2; exit 1; }

if [ -z "$PROD_DATABASE_URL" ]; then
  echo 'set PROD_DATABASE_URL (never put it in .env)' >&2
  exit 1
fi
if [ "$PROD_DATABASE_URL" = "$LOCAL_DATABASE_URL" ]; then
  echo 'refusing: PROD and LOCAL urls are identical' >&2
  exit 1
fi
case "$LOCAL_DATABASE_URL" in
  *localhost*|*127.0.0.1*|*@postgres:*|*@postgres/*) ;;
  *) echo 'refusing: LOCAL_DATABASE_URL does not look local' >&2; exit 1 ;;
esac
case "$PROD_DATABASE_URL" in
  *localhost*|*127.0.0.1*|*@postgres:*|*@postgres/*)
    echo 'refusing: PROD_DATABASE_URL looks local' >&2; exit 1 ;;
esac

echo "prod:  $(mask "$PROD_DATABASE_URL")"
echo "local: $(mask "$LOCAL_DATABASE_URL")"
echo "dump:  $DUMP_FILE"

if [ "$MODE" = 'all' ] || [ "$MODE" = 'dump' ]; then
  mkdir -p "$(dirname "$DUMP_FILE")"
  if [ "$DATA_ONLY" = true ]; then
    pg_dump "$PROD_DATABASE_URL" --format=custom --data-only --no-owner --no-acl \
      --exclude-schema=drizzle --file="$DUMP_FILE"
  else
    pg_dump "$PROD_DATABASE_URL" --format=custom --no-owner --no-acl --file="$DUMP_FILE"
  fi
  echo 'dump ok'
fi

if [ "$MODE" = 'all' ] || [ "$MODE" = 'restore' ]; then
  if [ ! -f "$DUMP_FILE" ]; then
    echo "dump file not found: $DUMP_FILE" >&2
    exit 1
  fi
  if [ "$DATA_ONLY" = true ]; then
    pg_restore --data-only --disable-triggers --no-owner --no-acl -d "$LOCAL_DATABASE_URL" "$DUMP_FILE"
  else
    pg_restore --clean --if-exists --no-owner --no-acl -d "$LOCAL_DATABASE_URL" "$DUMP_FILE"
  fi
  echo 'restore ok'
  if [ "$VACUUM" = true ]; then
    psql "$LOCAL_DATABASE_URL" -c 'VACUUM (ANALYZE);'
  fi
fi

echo 'done. data-only leaves local schema and __drizzle_migrations untouched; full mode imports prod history.'
