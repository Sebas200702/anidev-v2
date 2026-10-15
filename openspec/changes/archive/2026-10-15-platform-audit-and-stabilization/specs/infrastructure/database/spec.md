## Purpose

Hardens the PostgreSQL persistence layer with bounded connection pooling, foreign-key and filter indexes, unique user-profile constraints, cascade rules, atomic multi-statement writes, and set-based hot-path queries.

## ADDED Requirements

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
