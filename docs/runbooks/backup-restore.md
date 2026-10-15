# Runbook: backup & restore (PostgreSQL)

## Backup

```bash
pg_dump -h localhost -U anidev -d anidev -F c -f anidev-$(date +%F).dump
```

Store the dump off-host. Compose volumes (`postgres_data`) persist across
`docker compose down`, but `-v` wipes them — the dump is the recovery path.

## Restore

```bash
psql -c "CREATE DATABASE anidev_restore;"
pg_restore -h localhost -U anidev -d anidev_restore anidev-<date>.dump
psql -d anidev_restore -t -c "SELECT COUNT(*) FROM anime;"
```

Compare table count (`SELECT COUNT(*) FROM pg_tables WHERE
schemaname='public'`) and row counts against the source before promoting.

## Drill record (2026-10-15, local stack)

- `pg_dump -F c` → 94 KB dump, completed clean.
- Restored into fresh `anidev_restore_drill`: 41/41 tables, `anime` 4/4 rows,
  3/3 migrations. One cosmetic `pg_restore` warning (`SET
  transaction_timeout`, ignored, restore complete).
- Drill DB dropped afterwards. Next drill: quarterly or before any
  production write-path change.
