/**
 * Auth gate helpers for API routes.
 *
 * @module auth/utils/require-auth
 * @remarks
 * Pulls the actor populated by `src/middleware/auth-middleware.ts` and throws
 * {@link authRequired} when no session user is attached. Use from any write
 * route that requires an authenticated actor.
 * @see {@link sessionService.getSession} for non-middleware lookups
 * @example
 * ```typescript
 * export const POST: APIRoute = withZodValidation(createUserProfileSchema)(
 *   async ({ locals, validated }) => {
 *     const userId = requireAuthSession(locals)
 *     // ...
 *   }
 * )
 * ```
 */
import { authRequired } from '@shared/errors/auth-errors'
import type { User } from '@lib/auth/server'

/**
 * Narrows the `App.Locals` shape for auth gates.
 *
 * @remarks
 * Astro's `App.Locals` defines `user` and `session` as nullable; this type
 * keeps the helper signature small without depending on Astro internals.
 */
export interface AuthLocals {
  user: User | null
  session?: unknown
}

/**
 * Returns the authenticated user id or throws {@link authRequired}.
 *
 * @param locals - Astro `App.Locals` for the current request
 * @returns The authenticated {@link User.id}
 * @throws {AuthError} With code `AUTH_REQUIRED` when `locals.user` is null
 * @remarks
 * Callers in write routes should invoke this before any domain service so
 * unauthenticated traffic never reaches persistence.
 * @see {@link authRequired}
 * @example
 * ```typescript
 * const userId = requireAuthSession(locals)
 * await userService.createUserProfile({ userId, input })
 * ```
 */
export const requireAuthSession = (locals: AuthLocals): string => {
  if (!locals.user) {
    throw authRequired({ route: 'auth-required-route' })
  }
  return locals.user.id
}
