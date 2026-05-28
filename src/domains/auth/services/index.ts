/**
 * Authentication service exports.
 *
 * @module domains/auth/services
 * @remarks
 * Better Auth service wrappers that isolate API route handlers from direct `auth.api` calls.
 * Both services forward incoming request headers (cookies) and return response headers so
 * session cookies set by Better Auth propagate back to the client.
 *
 * @see {@link credentialsService} — `signInEmail` and `signUpEmail`
 * @see {@link sessionService} — `getSession` and `signOut`
 * @see {@link mapBetterAuthError} — shared error normalization for all service methods
 *
 * @example
 * ```typescript
 * import { credentialsService, sessionService } from '@domains/auth/services'
 *
 * const loginResult = await credentialsService.login(body, request.headers)
 * const session = await sessionService.getSession(request.headers)
 * ```
 */

/** Credential-based sign-in and registration via Better Auth. */
export * from './credentials-service'
/** Session lookup and sign-out via Better Auth. */
export * from './session-service'
