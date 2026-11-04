# infrastructure/database Specification

## Purpose

Provides relational persistence for the application via Drizzle ORM on a PostgreSQL database, replacing the legacy Turso/LibSQL SQLite storage as the single typed data access layer.

## Requirements

### Requirement: PostgreSQL-backed Drizzle client
The system SHALL expose a singleton Drizzle ORM client connected to a PostgreSQL `DATABASE_URL` through a Node PostgreSQL driver, using `pg-core` table definitions.

#### Scenario: Client connects to PostgreSQL
- **WHEN** the application imports the database client with a valid `DATABASE_URL`
- **THEN** it initializes a single shared Drizzle instance usable by repositories and the auth adapter

#### Scenario: Missing connection variable fails fast
- **WHEN** `DATABASE_URL` is absent or invalid
- **THEN** environment validation rejects startup before any query is attempted

### Requirement: Drizzle schemas target PostgreSQL
All table, column, index, and relation definitions SHALL use `drizzle-orm/pg-core` constructs and correct PostgreSQL column types, replacing `sqlite-core` definitions.

#### Scenario: Boolean columns map to PostgreSQL booleans
- **WHEN** a schema declares a boolean flag (e.g. `emailVerified`)
- **THEN** it maps to a PostgreSQL `boolean` column rather than an integer

#### Scenario: Timestamps map to timestamp columns
- **WHEN** a schema declares a timestamp
- **THEN** it maps to a PostgreSQL timestamp value instead of a millisecond integer

### Requirement: Existing query semantics preserved
Repositories and services SHALL continue to read and write the same business data through the PostgreSQL client with no change to public service or route behavior.

#### Scenario: Existing queries still resolve
- **WHEN** a repository executes its Drizzle queries against the new client
- **THEN** it returns the same shapes and error behavior as before, with query results unaffected by the dialect change

### Requirement: Migration support via drizzle-kit
The system SHALL provide a `drizzle.config` so that `db:generate` and `db:migrate` produce and apply PostgreSQL migrations.

#### Scenario: Schema generates migrations
- **WHEN** `db:generate` runs against the PostgreSQL schema
- **THEN** a new migration file targeting the PostgreSQL dialect is produced

#### Scenario: Migrations apply cleanly
- **WHEN** `db:migrate` runs against a PostgreSQL instance
- **THEN** the generated schema is applied without error

### Requirement: Graceful degradation when database is unavailable
The system SHALL keep the application running and serving pages even when the PostgreSQL database is unreachable; routes and pages that depend on database data SHALL respond with a typed, mapped error and must not crash the server process.

#### Scenario: Database dependent route errors gracefully
- **WHEN** a route performs a database query and the database is unavailable
- **THEN** the route returns a structured error response (via the standard error mapping) and the process stays alive to serve non-database traffic

#### Scenario: Database recovers without restarted process
- **WHEN** the database becomes reachable again after an outage
- **THEN** subsequent database queries succeed without requiring a process restart

### Amended 2026-10-15 (`platform-audit-and-stabilization`)

### Requirement: Bounded PostgreSQL connection pool

The database client SHALL configure `pg.Pool` with explicit `max`, `idleTimeoutMillis`, and `connectionTimeoutMillis` bounds appropriate for the 8 GB RAM VPS budget.

#### Scenario: Pool enforces maximum connections

- **WHEN** the database client initializes `pg.Pool`
- **THEN** the pool limits concurrent connections to the configured `max` and times out stalled connection acquisitions

### Requirement: Indexed foreign keys, catalog filters, and unique user profile

The database schema SHALL define B-tree indexes on all media/music foreign keys and catalog filter/sort columns, a GIN `pg_trgm` index on `anime_title_synonym.title`, `ON DELETE CASCADE` on catalog junction foreign keys, and a unique index on `profile.user_id`.

#### Scenario: Duplicate profile for the same auth user is rejected

- **WHEN** a database insert attempts to create a second `profile` row with an existing `user_id`
- **THEN** PostgreSQL enforces the `profile_user_id_unique` constraint

#### Scenario: Media lookup by anime ID uses an index

- **WHEN** a repository queries `anime_media` by `anime_id`
- **THEN** PostgreSQL uses `anime_media_anime_id_idx` instead of a sequential scan

#### Scenario: Media eligibility lookup is index-backed

- **WHEN** the carousel eligibility query filters `anime_media` by `media_type` for banner and clear-logo assets
- **THEN** the plan uses an index scan on `anime_media` instead of scanning the full table

### Requirement: Multi-statement invariants run atomically

Repository operations whose correctness depends on more than one statement (e.g. insert-then-prune cap enforcement in `search_history`) MUST run inside a database transaction so a partial failure cannot leave the invariant violated.

#### Scenario: Search-history cap survives concurrent records

- **WHEN** two concurrent `record` calls insert rows for the same user near the per-user cap
- **THEN** the final row count for that user never exceeds the cap and a failure between statements rolls both back together

### Requirement: Hot catalog read paths are set-based and bounded

Catalog read paths on request-hot flows (home carousel, list endpoints) MUST NOT load unbounded table slices into application memory for filtering, and MUST reuse batch accessors instead of issuing per-item queries where a batch query exists.

#### Scenario: Carousel eligibility is resolved in SQL

- **WHEN** the home carousel resolves the most popular anime that have both a banner and a clear logo
- **THEN** eligibility is computed with SQL aggregation over indexed columns and the resulting page is fetched with a bounded query (no full-table scan plus in-memory intersection)

#### Scenario: Carousel media fan-out is batched

- **WHEN** the carousel service needs media assets for up to six eligible anime
- **THEN** it fetches them with a single batch accessor (`getMediaByAnimeIds`) instead of one query per anime
