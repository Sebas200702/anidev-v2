# Migration rebaseline (2026-08-15)

The migration history was **squashed into a clean baseline**. The previous
`0000_clammy_marvel_zombies` was unappliable from scratch: it declared
`profile.user_id` as `integer` while `user.id` is `text`, so the
`profile_user_id_user_id_fk` foreign key failed with `datatype_mismatch`
(Postgres `42804`) on any fresh database. Existing databases had been built up
incrementally and masked the defect until the E2E CI job attempted the first
true from-scratch `drizzle-kit migrate`.

## What changed

The three prior migrations were replaced by two, regenerated from the current
(correct) Drizzle schema:

- `0000_parallel_the_fury.sql` — full schema (auth, anime catalog, `profile`
  with a **text** `user_id`, `search_history`, …), generated via `db:generate`.
- `0001_search_text_trgm_indexes.sql` — the custom `pg_trgm` extension + GIN
  trigram indexes (not expressible in the Drizzle schema, re-added by hand).

Fresh environments (CI, disaster recovery, a new prod) now migrate cleanly.

## Reconciling an ALREADY-migrated database (prod / local dev)

A database that already ran the old `0000`–`0002` has the old rows in
`drizzle.__drizzle_migrations`. `drizzle-kit migrate` decides what to apply by
comparing the journal's `when` timestamps against the latest recorded
`created_at` — the new baseline's timestamps are newer, so migrate would try to
**re-create existing tables** and fail. Before the next migrate, mark the new
baseline as already applied (one-time, coordinated):

```sql
-- Idempotent structures already exist; only the tracking table is rewritten.
BEGIN;
DELETE FROM drizzle.__drizzle_migrations;
INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES
  ('4e65b7987d9c794cc743f92543a5b689d1d488584e78e0acd3fd1616c5f55678', 1786762124913),
  ('0c919bb67c418aada3dd0d6e6a7ae441b4b3e8f1f351a834c824a9acc5c7e4cf', 1786762135119);
COMMIT;
```

After this, `bun run db:migrate` is a no-op on that database.

> **Known residual drift (separate follow-up):** databases provisioned from the
> old `0000` physically have `profile.user_id` as `integer`, which does not match
> the new baseline's `text`. The reconciliation above does **not** rewrite the
> column. If the `profile` FK is needed on an existing environment, run a
> corrective `ALTER TABLE profile ALTER COLUMN user_id TYPE text …` (and rebuild
> the FK) as a deliberate, data-aware step.
