## Purpose

Hardens the PostgreSQL persistence layer with bounded connection pooling, foreign-key and filter indexes, unique user-profile constraints, and cascade rules.

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
