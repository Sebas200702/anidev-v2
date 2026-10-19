# Design: ingest queue on Postgres (`ingest.*`)

## 1. Findings (evidence-first)

| # | Finding | Evidence |
|---|---|---|
| Q-01 | The queue is not crash-safe: claim is a plain `SELECT`, the whole batch is marked `in_progress` up front, and stale reset only runs at process start | `src/repositories/tasks.ts` (`getPendingTasks`, `resetStaleTasks`), `src/core/genericManager.ts` (`markTasksInProgress` before dispatch) in the scraper repo |
| Q-02 | `failed` is terminal: no retry, no dead-letter column, `attempts` increments but governs nothing | scraper `repositories/tasks.ts` (`markTaskFailed`) |
| Q-03 | Freshness metadata is dead: `last_scraped_at` is never written and `scheduled_at` never gates a claim, so completed tasks can never refresh | scraper schema `src/schemas/scrapingTasks.ts` + repo-wide grep |
| Q-04 | The "only missing" logic today is an in-memory pre-check (`getExistingEntityIds`) that loads every entity id and blocks all refresh by construction | scraper `scripts/initialize*Tasks.ts` |
| Q-05 | `postgres:16-alpine` (the compose image) does **not** ship `pg_cron`; using it would require an image change | `docker-compose.yml` (`image: postgres:16-alpine`), Postgres contrib-list |
| Q-06 | Turbo-catalog writes are currently silent-lossy (failed upserts still mark tasks completed) — fixed on the scraper side in its Fase 0/1, but the queue must make write failures observable | scraper `shared/batchUpsert.ts` + `core/genericManager.ts` |

## 2. Decisions

### D-Q1 — Schema location and ownership
The queue lives in its own `ingest` schema in the shared Postgres, defined with
**pg-core Drizzle by anidev-v2** and shipped as a normal migration
(`bun run db:generate` → `drizzle/` → `bun run db:migrate`). The scraper repo
mirrors the table definitions for typing only and connects with a role that has
no DDL privileges. Rationale: D.2 ("anidev-v2 es dueño único del
esquema/migraciones, el scraper no define DDL"); a separate schema keeps
`ingest.*` out of the app's table namespace and makes the least-privilege grant
trivial.

### D-Q2 — Task identity
One row per `(source, task_type, entity_id)` with a unique index. `entity_id` is
text (numeric ids as strings, slugs for AnimeThemes), `task_type` is a
namespaced string (`jikan.anime_full`, `kitsu.episodes`, `animethemes.artist`).
This replaces the scraper's current convention of embedding the task type into
`entity_id` (`anime_details_123`) inside a single `entityType` — which also
collides today between AnimeThemes anime slugs and artist slugs sharing one
namespace.

### D-Q3 — Claim, lease, reaper
```sql
WITH due AS (
  SELECT id FROM ingest.task
  WHERE status = 'pending' AND scheduled_at <= now()
  ORDER BY priority DESC, scheduled_at ASC
  LIMIT $1
  FOR UPDATE SKIP LOCKED
)
UPDATE ingest.task t
SET status = 'in_progress',
    leased_until = now() + interval '5 minutes',
    attempts = t.attempts + 1
FROM due WHERE t.id = due.id
RETURNING t.*;
```
- Lease default 5 minutes, extended by heartbeat while a task is in flight.
- Reaper: every run (and by the scheduler tick) re-queues `in_progress` rows
  with `leased_until < now()` — bounded by `attempts < max_attempts`, otherwise
  `dead_letter`.
- Backoff: transient failures set `scheduled_at = now() + backoff(attempts)` with
  jitter; `Retry-After` wins over the computed backoff.
- `dead_letter` is a terminal status with `last_error` retained; re-arming is an
  explicit operator action (SQL), never automatic.

### D-Q4 — Freshness as data
`ingest.task_policy(source, task_type, refresh_interval, max_attempts,
priority)`. On completion: `refresh_after = now() + refresh_interval`; the
generator upsert re-arms due rows:
```sql
INSERT INTO ingest.task (source, task_type, entity_id, payload, priority, scheduled_at)
SELECT ... FROM <catalog source rows>
ON CONFLICT (source, task_type, entity_id) DO UPDATE
  SET status = 'pending', scheduled_at = now()
  WHERE ingest.task.status = 'completed'
    AND ingest.task.refresh_after <= now();
```
Special cases are policy values, not code: `airing` anime hydrate weekly,
finished titles quarterly, episodes only after the broadcast day, AnimeThemes
artist pages monthly, etc. `skipped` (with `skip_reason`) covers
not-applicable work (e.g. no Kitsu id yet): it does not reset `refresh_after`
and is re-armed by the dependency's completion.

### D-Q5 — Scheduling: Dokploy Schedules (not pg_cron)
The deployed stack already runs under **Dokploy** (project `AniDev` holds the
app, Postgres and the `dragonfly-db` / `rustrak-full` / `libredb-studio`
composes), so the incremental loop is scheduled with **Dokploy Schedules**
(cron per source/task-type, plus manual runs from the UI) instead of a database
extension: `postgres:16-alpine` does not ship `pg_cron`, and a scheduler that
lives inside the thing being scheduled silently drops jobs when the database
pauses or restarts. A host crontab remains the fallback if Dokploy Schedules is
unavailable, and `pg_cron` is revisited only if the image changes to ParadeDB
for the Stage-2 BM25 index (D3). Either way the queue semantics above do not
change.

### D-Q6 — Credentials
A dedicated `scraper` role: full DML on `ingest.*`, `SELECT`/`INSERT`/`UPDATE`
on catalog tables, no DDL anywhere, no access to `auth*`/`user`/`session`
tables. Wired through `DATABASE_URL_SCRAPER` in compose; documented with the
grant statements.

### D-Q7 — Run registry
`ingest.run(id, source, mode, started_at, finished_at, tasks_processed,
tasks_retried, tasks_blocked, tasks_dead_lettered, notes)` — one row per run.
It powers the future control dashboard (D.0) and the coverage metrics (D.3)
without parsing scraper logs.

## 3. Risks

- **VPS budget (D8)**: Modo B must stay light — a small pool (`max: 5`), one
  scraper container, and rate limits enforced in the scraper (not in the DB).
  The queue itself is cheap; the load is network-bound.
- **Long leases vs stuck workers**: a crashed worker holds rows until the lease
  expires; the reaper bounds the delay and `attempts` bounds the retries.
- **Generator volume**: the upsert above runs over ~30k anime per task type —
  keep it a single set-based statement (no per-row round trips) and measure.
- **Two writers during transition**: until the scraper's Turso path is fully
  retired, only the Postgres path runs in prod; Modo A runs in the local stack
  against a cloned catalog (`bun run db:clone-prod`).

## 4. Alternatives considered

- **Keeping the queue in SQLite/Turso** — rejected: no `SKIP LOCKED`, remote
  round-trips per claim, and D2 already decided Postgres-native.
- **`pg_cron` now** — rejected on Q-05 + the pause/failure mode; revisited with
  the ParadeDB image.
- **One table for policy + tasks** — rejected: cadence changes (dashboard)
  would rewrite every task row.
- **Queue in a separate database** — rejected: promotion and refresh read the
  same catalog; cross-database writes add a failure mode for zero benefit.
