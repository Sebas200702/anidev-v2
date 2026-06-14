/**
 * Authentication utility exports.
 *
 * @module domains/auth/utils
 * @remarks
 * Helpers for translating Better Auth runtime errors into typed domain errors that
 * {@link mapErrorToHttp} can map to consistent HTTP responses. Used by
 * {@link credentialsService} and {@link sessionService} as a shared error boundary.
 *
 * @see {@link mapBetterAuthError} — normalizes Better Auth failures to domain errors
 *
 * @example
 * ```typescript
 * import { mapBetterAuthError } from '@domains/auth/utils'
 *
 * try {
 *   await auth.api.signInEmail({ body, headers })
 * } catch (error) {
 *   throw mapBetterAuthError(error)
 * }
 * ```
 */

export { mapBetterAuthError } from './map-better-auth-error-util'
