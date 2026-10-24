# infrastructure/ingest-queue Specification

## Purpose

Own the Postgres-native task queue that the `anime-scraper-v2` ingestion
pipeline claims, leases and completes, so catalog backfills (Modo A) and
incremental updates (Modo B) are crash-safe, resumable and refresh-driven,
with anidev-v2 as the single owner of the DDL.

## ADDED Requirements

### Requirement: anidev-v2 owns the ingest schema

The ingestion queue SHALL be defined and migrated exclusively by anidev-v2
using pg-core Drizzle definitions, and the scraper SHALL NOT create, alter or
drop database objects.

#### Scenario: Migration applies additively

- **WHEN** `bun run db:migrate` runs against the shared database
- **THEN** the `ingest` schema and its tables are created without altering any
  catalog table or existing row

#### Scenario: Scraper cannot perform DDL

- **WHEN** the scraper connects with its scoped role and attempts a DDL
  statement
- **THEN** the statement is rejected by permissions while its normal DML on
  `ingest.*` and catalog tables succeeds

### Requirement: Atomic claim with lease

Claiming SHALL select due pending tasks with `FOR UPDATE SKIP LOCKED` and mark
them `in_progress` with a lease, so concurrent claimers never receive the same
task; a reaper SHALL return tasks with expired leases to `pending`.

#### Scenario: Concurrent claims are disjoint

- **WHEN** two claimers request due tasks at the same time
- **THEN** each receives a disjoint set and no task is claimed twice

#### Scenario: Expired lease is recovered

- **WHEN** a worker stops heartbeating and its `leased_until` passes
- **THEN** the reaper returns the task to `pending` (or to `dead_letter` if
  attempts are exhausted) and it becomes claimable again

### Requirement: Attempts, backoff and dead-letter

Transient failures SHALL increment `attempts` and reschedule the task with
backoff and jitter, honoring a source `Retry-After` when present; tasks
exceeding `max_attempts` SHALL move to `dead_letter` with their last error
retained and SHALL NOT be retried automatically.

#### Scenario: Retry-After takes precedence

- **WHEN** a task fails with an upstream `429` carrying `Retry-After: 30`
- **THEN** `scheduled_at` is at least 30 seconds in the future before the task
  can be claimed again

#### Scenario: Exhausted attempts dead-letter

- **WHEN** a task fails for the last allowed attempt
- **THEN** it transitions to `dead_letter` with `last_error` and is excluded
  from claims until an operator re-arms it

### Requirement: Idempotent identity and policy-driven freshness

Each unit of work SHALL be uniquely identified by
`(source, task_type, entity_id)`; generators SHALL insert missing rows and
re-arm completed rows whose `refresh_after` has passed, without duplicating
work, and refresh cadence SHALL live in `ingest.task_policy` data.

#### Scenario: Generator is idempotent

- **WHEN** the same generator runs twice in a row
- **THEN** no duplicate task rows exist and no fresh completed task is re-armed

#### Scenario: Cadence changes without a deploy

- **WHEN** an operator updates a `refresh_interval` in `ingest.task_policy`
- **THEN** subsequent completions of that task type schedule their next refresh
  accordingly, with no code change or restart

### Requirement: Non-applicable work is skipped, not failed

Work that cannot run because upstream data is missing SHALL be recorded as
`skipped` with a reason, SHALL NOT consume retries, and SHALL be re-armed when
the blocking dependency completes.

#### Scenario: Missing external mapping

- **WHEN** an episode task requires a Kitsu id that the mapping task has not
  resolved yet
- **THEN** the episode task is `skipped` with `skip_reason = 'missing:kitsu_id'`
  and becomes `pending` again when the mapping task completes with an id

### Requirement: Run registry and metrics

Each pipeline run SHALL record a row in `ingest.run` with source, mode, start
and finish timestamps, and counts of processed, retried, blocked and
dead-lettered tasks, so coverage and health are queryable without parsing logs.

#### Scenario: Run is auditable

- **WHEN** an incremental run finishes
- **THEN** `ingest.run` holds one row with its counters and `finished_at` set,
  and a failed run leaves `finished_at` null plus a note

### Requirement: Scoped credentials

The scraper SHALL connect with a dedicated role limited to DML on `ingest.*`
and the catalog tables it ingests, with no DDL privileges and no access to
auth, session or user tables.

#### Scenario: Least privilege enforced

- **WHEN** the scoped role queries an `auth`/`user` table
- **THEN** the query is rejected by permissions

### Requirement: External scheduling

The incremental loop SHALL be triggered by an external scheduler — **Dokploy
Schedules** on the `AniDev` project, with a host crontab as fallback —
invoking the scraper service, and SHALL NOT depend on database-resident
scheduling while the deployed Postgres image lacks the `pg_cron` extension.

#### Scenario: Missed tick is not silent data loss

- **WHEN** the scheduler does not run for a period
- **THEN** due tasks remain `pending` and are picked up (and reported) on the
  next run instead of being lost inside a paused database
