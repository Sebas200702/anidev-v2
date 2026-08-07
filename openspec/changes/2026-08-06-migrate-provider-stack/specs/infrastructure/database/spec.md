## Purpose

Provides relational persistence for the application via Drizzle ORM on a PostgreSQL database, replacing the legacy Turso/LibSQL SQLite storage as the single typed data access layer.

## ADDED Requirements

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