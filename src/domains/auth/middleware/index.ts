/**
 * Authentication middleware exports.
 *
 * @module domains/auth/middleware
 * @remarks
 * Helpers for resolving the authenticated actor (user + session) in Astro middleware and
 * server routes. These utilities read Better Auth session cookies from incoming headers
 * without throwing — suitable for optional-auth page rendering.
 *
 * @see {@link resolveAuthActor} — loads `App.Locals.user` and `App.Locals.session`
 * @see {@link sessionService.getSession} — throwing variant for API routes
 *
 * @example
 * ```typescript
 * import { resolveAuthActor } from '@domains/auth/middleware'
 *
 * const { user, session } = await resolveAuthActor(Astro.request.headers)
 * Astro.locals.user = user
 * Astro.locals.session = session
 * ```
 */

export { resolveAuthActor } from './resolve-auth-actor'
