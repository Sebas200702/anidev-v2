/**
 * @module lib/auth
 *
 * Authentication infrastructure built on Better Auth with a Drizzle SQLite
 * adapter. Exports the server instance for API routes and middleware, the
 * typed browser client for sign-in flows, and inferred session/user types
 * for end-to-end type safety.
 *
 * @remarks
 * Import from this barrel in application code that needs both server and
 * client symbols. Import `./server` or `./client` directly in framework
 * entry files (middleware, Astro pages) when you must avoid bundling server
 * secrets or Node-only adapters into client islands.
 *
 * **Re-exports:**
 * - `./server` — `auth`, `Auth`, `Session`, `User`
 * - `./client` — `authClient`
 *
 * @see {@link module:lib/db/schemas/auth-schema} for underlying auth tables
 * @see {@link module:middleware/auth-middleware} for session resolution on requests
 */

export { auth } from './server'
export type { Auth, Session, User } from './server'
export { authClient } from './client'
