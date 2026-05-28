/**
 * @module types/env.d
 *
 * Ambient TypeScript declarations that augment Astro's global `App` namespace
 * and document the shape of authenticated request locals. Ensures middleware,
 * pages, and API routes share consistent typing for `user` and `session`
 * without manual casting.
 *
 * @remarks
 * This file is a declaration-only module (`.d.ts`); it emits no JavaScript.
 * Types are sourced from the Better Auth server instance so client and server
 * stay aligned when auth plugins change session payload fields.
 *
 * @see {@link module:lib/auth/server} for inferred `User` and `Session` types
 * @see {@link module:middleware/auth-middleware} for runtime population of locals
 */
/// <reference path="../../.astro/types.d.ts" />

declare namespace App {
  /**
   * Per-request context attached by Astro middleware and available in
   * pages, endpoints, and `Astro.locals`.
   */
  interface Locals {
    /**
     * Authenticated user record, or `null` when the request is anonymous or
     * session resolution failed on a protected route.
     *
     * @see {@link module:lib/auth/server.User}
     */
    user: import('@lib/auth/server').User | null

    /**
     * Active session metadata (token expiry, id), or `null` when no valid
     * session is bound to the request.
     *
     * @see {@link module:lib/auth/server.Session}
     */
    session: import('@lib/auth/server').Session['session'] | null
  }
}
