# Tasks — ingest queue on Postgres (`ingest.*`)

> TDD-first: failing test (unit and/or integration) before implementation.
> In dependency order; do not start a later phase before its predecessor passes
> its gate. Integration specs follow the repo convention
> (`*.integration.test.ts`, gated by `RUN_DB_TESTS=1`, real Postgres).

## A. Schema + migration

- [ ] A.1 Add `src/lib/db/schemas/ingest.ts` with pg-core definitions for
  `ingest.task` (unique `(source, task_type, entity_id)`, status check,
  `attempts`/`max_attempts`, `scheduled_at`, `leased_until`, `last_scraped_at`,
  `refresh_after`, `last_error`, `skip_reason`, jsonb `payload`),
  `ingest.task_policy` and `ingest.run`; re-export from
  `src/lib/db/schemas/index.ts`.
- [ ] A.2 Generate and apply the migration
  (`bun run db:generate` → review SQL → `bun run db:migrate` against the local
  compose stack). Verify it is additive: no catalog table is altered.
- [ ] A.3 Indexes required by the claim: partial index on
  `(priority DESC, scheduled_at)` where `status = 'pending'`; index on
  `(status, leased_until)` for the reaper.

## B. Claim / lease / reaper semantics (integration-tested)

- [ ] B.1 Failing integration test first: two concurrent claimers receive
  disjoint task sets (run two `FOR UPDATE SKIP LOCKED` claims in parallel
  transactions); a claimed row is invisible to other claimers until the lease
  expires.
- [ ] B.2 Failing integration test first: reaper re-queues an expired lease back
  to `pending`; a row at `max_attempts` moves to `dead_letter` with
  `last_error` retained and is never claimed again.
- [ ] B.3 Failing integration test first: generator upsert is idempotent
  (running it twice creates no duplicates) and re-arms only rows whose
  `refresh_after <= now()`; a fresh `completed` row is untouched.
- [ ] B.4 Implement the SQL as documented functions/statements (claim, reaper,
  complete-with-refresh, generator upsert) with a shared TypeScript wrapper
  consumed by the scraper.
- [ ] B.5 Upsert `ingest.task_policy` seeds for the known task types
  (`jikan.*`, `kitsu.episodes`, `animethemes.*`, `tvdb.*`) with the intervals
  agreed in the scraper's fill/refresh strategy.

## C. Credentials, compose and scheduling

- [ ] C.1 Postgres role `scraper` + grants (DML on `ingest.*`; DML on catalog
  tables; no DDL; no auth/user access). Document the exact statements in the
  operator docs and wire `DATABASE_URL_SCRAPER` in `.env.example` /
  `.env.local.example`.
- [ ] C.2 Deploy the scraper in Dokploy under the `AniDev` project: an
  **Application** built from the scraper repo (Dockerfile based on
  `oven/bun`, `bun install && bun run build`, entrypoint
  `bun dist/src/index.js <source>`), attached to the same network as the
  Dokploy-managed Postgres, `restart: no` (it is invoked, not a daemon). If a
  compose definition is preferred, add the equivalent service to
  `docker-compose.yml` instead.
- [ ] C.3 Create **Dokploy Schedules** for Modo B (one cron per source, plus a
  `runManually` path from the UI) and document the host-crontab fallback and
  the `pg_cron` rejection rationale (image lacks the extension; revisit with
  ParadeDB in D3).
- [ ] C.4 Document Modo A operation in the local stack: clone the prod catalog
  (`bun run db:clone-prod`), run the scraper against the local DSN, promote
  later via the (future) diff-upsert change.

## D. Verification, release & archive

- [ ] D.1 Full gate on the feature branch (`format` → `check` → `check:types` →
  `test` → `test:integration` → `build`).
- [ ] D.2 Doubt pass: re-read the delta against `ROADMAP.md` Track D and the
  scraper's `ROADMAP.md` Fase 2; confirm no catalog table changed and no
  `pg_cron` dependency is implied.
- [ ] D.3 Release on the branch (`bun run release:minor`), open PR, green CI,
  merge, push tag, then archive (sync delta into `openspec/specs/`).
