/**
 * Authentication utility exports.
 *
 * @module domains/auth/utils
 * @remarks
 * Helpers for translating Better Auth runtime errors into typed domain errors that
 * {@link mapErrorToHttp} can map to consistent HTTP responses, plus the route auth
 * gate used by write endpoints. Used by {@link credentialsService} and
 * {@link sessionService} as a shared error boundary.
 *
 * @see {@link mapBetterAuthError} — normalizes Better Auth failures to domain errors
 * @see {@link requireAuthSession} — narrows `App.Locals` to an authenticated actor
 *
 * @example
 * ```typescript
 * import { mapBetterAuthError, requireAuthSession } from '@auth/utils'
 *
 * try {
 *   await auth.api.signInEmail({ body, headers })
 * } catch (error) {
 *   throw mapBetterAuthError(error)
 * }
 * ```
 */

export { mapBetterAuthError } from './map-better-auth-error'
export { requireAuthSession } from './require-auth'
export type { AuthLocals } from './require-auth'
