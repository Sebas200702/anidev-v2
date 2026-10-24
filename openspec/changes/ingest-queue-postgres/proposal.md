# Proposal: ingest queue on Postgres (`ingest.*`)

## Why

Track D resumes catalog ingestion from
[`anime-scraper-v2`](https://github.com/Sebas200702/anime-scraper-v2), but the
scraper's task queue currently lives in Turso/libSQL (SQLite): a plain `SELECT`
with no claim or lease, whole-batch `in_progress` marking, startup-only stale
reset, and `failed` as a terminal state. A crashed run loses whole slices of
work, two concurrent instances can steal each other's tasks, and completed work
can never be refreshed because the initializer refuses to re-create existing
rows. D2 already decided the queue is **Postgres-native**
(`FOR UPDATE SKIP LOCKED` + `pg_cron`) and D.2 decided that **anidev-v2 owns all
DDL** — including the queue schema. This change defines that schema, its
claim/lease semantics, freshness policies, run registry, scoped credentials and
its scheduling hookup, so both ingestion modes (A: isolated backfill, B:
incremental in prod) can be built against it.

## What Changes

- Add an `ingest` schema owned by anidev-v2 with three tables:
  - `ingest.task` — one row per unit of work, keyed by
    `(source, task_type, entity_id)`, with `status`, `priority`, `payload`
    (jsonb), `attempts`/`max_attempts`, `scheduled_at`, `leased_until`,
    `last_scraped_at`, `refresh_after`, `last_error`.
  - `ingest.task_policy` — refresh interval per `(source, task_type)` so cadence
    is data, not code (the control dashboard edits this table).
  - `ingest.run` — one row per pipeline run with counts (processed, retries,
    blocked, dead-lettered) and mode/source metadata.
- Claim semantics: atomic `FOR UPDATE SKIP LOCKED` claim + lease, a reaper that
  re-queues expired leases, `attempts` → `dead_letter` after the cap, and
  backoff via `scheduled_at` (honoring source `Retry-After`).
- Freshness: on completion the task is re-armed at `refresh_after` computed
  from `ingest.task_policy`; generators insert only missing rows and re-arm due
  rows — never duplicate work. Work blocked by missing upstream data is
  `skipped` (with reason), not `failed`, and is re-armed when the dependency
  resolves.
- Scoped credentials: a dedicated Postgres role for the scraper limited to
  `ingest.*` plus the catalog tables it writes; no DDL, no access to
  auth/user tables.
- Compose service for the scraper (Modo B) and an **external scheduler** that
  invokes it: **Dokploy Schedules** on the existing `AniDev` project (the stack
  already runs under Dokploy), with host cron as fallback; `pg_cron` is
  explicitly rejected until the Postgres image changes (the current
  `postgres:16-alpine` does not ship the extension).

## Capabilities

### New Capabilities

- `infrastructure/ingest-queue`: anidev-v2 ownership of the ingestion queue DDL,
  crash-safe claim/lease/reaper/dead-letter semantics, policy-driven freshness,
  run registry, scoped credentials and scheduling.

### Modified Capabilities

<!-- None: the app keeps reading the same catalog tables; this change adds the
ingestion plane next to them. -->

## Impact

- **anidev-v2**: `src/lib/db/schemas/ingest.ts` (+ re-export in
  `src/lib/db/schemas/index.ts`), one drizzle migration under `drizzle/`,
  `docker-compose.yml` (`scraper` service), operator docs for the scraper role
  and the host cron entry.
- **anime-scraper-v2** (separate repo): consumes the schema through mirrored
  pg-core definitions and a DSN; it never generates DDL. Its port from
  sqlite-core to pg-core is scoped in that repo's `ROADMAP.md` (Fase 2).
- **Follow-ups** (separate changes, not scoped here): promotion diff-upsert
  (Modo A → prod) and the control dashboard UI for cadence/scope.

## Non-goals

- No data migration of the existing Turso `scraping_tasks` state (the queue is
  derived state; generators rebuild it).
- No `pg_cron` requirement: scheduling is external by design (a paused or
  restarted database must never silently drop scheduled jobs).
- No changes to catalog tables (that is `catalog-coverage-fields`).
- No dashboard UI yet; only the tables it will read.

## Breaking changes

None. Purely additive schema in a new `ingest` schema; existing readers of the
catalog are untouched.
