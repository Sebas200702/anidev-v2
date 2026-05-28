/**
 * @module lib
 *
 * Top-level infrastructure barrel re-exporting authentication, caching,
 * database, and monitoring modules. Provides a single import path for shared
 * cross-cutting concerns used by domain services, API routes, and middleware.
 *
 * @remarks
 * Import from `@lib` when a module needs multiple infrastructure pieces (e.g.
 * auth + db). Import from `@lib/auth`, `@lib/cache`, `@lib/db`, or
 * `@lib/monitoring` directly when you only need one subsystem — this improves
 * tree-shaking clarity and avoids pulling unused schema symbols into bundles.
 *
 * **Re-exports:**
 * - `./auth` — Better Auth server instance, client, and session types
 * - `./cache` — Redis client, TTL presets, and read-through helpers
 * - `./db` — Drizzle client, connection tuning, and all schema tables
 * - `./monitoring` — Sentry initialization for server, Astro, and React
 *
 * @see {@link module:lib/auth} for authentication
 * @see {@link module:lib/cache} for Redis caching
 * @see {@link module:lib/db} for database access
 * @see {@link module:lib/monitoring} for error reporting
 */
export * from './auth'
export * from './cache'
export * from './db'
export * from './monitoring'
