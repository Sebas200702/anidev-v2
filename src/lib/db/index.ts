/**
 * @module lib/db
 *
 * Database access layer for the Turso-hosted SQLite database via Drizzle ORM
 * and `@libsql/client`. Re-exports the shared client, connection tuning config,
 * and all Drizzle schema table definitions used by repositories and Better Auth.
 *
 * @remarks
 * Import from `@db` or `@lib/db` in repositories and services. Import
 * `@db/schemas/*` directly when a module needs only specific tables to reduce
 * symbol surface and speed up type checking. The client is a process singleton.
 *
 * **Re-exports:**
 * - `./schemas` — all Drizzle table and relation definitions
 * - `./client` — shared `db` Drizzle instance
 * - `./config` — `dbConfig` connection and batch limits
 *
 * @see {@link module:config/env} for Turso credentials
 * @see {@link module:lib/db/client} for the Drizzle client
 * @see {@link module:lib/db/schemas} for table catalog
 */

export { db } from './client'
export { dbConfig } from './config'
// Schema tables — import `@db/schemas` or individual files for leaner imports.
export * from './schemas'
