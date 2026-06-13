/**
 * @module lib/auth/client
 *
 * Browser-side Better Auth client factory bound to the server auth instance
 * type. Used by React islands and client scripts for sign-in, sign-out,
 * registration, and session polling without duplicating endpoint contracts.
 *
 * @remarks
 * Safe for client bundles — contains no secrets. Relies on Better Auth cookie
 * sessions and same-origin API routes. Generic parameter `{@link Auth}` ensures
 * method signatures match server plugin configuration.
 *
 * @see {@link module:lib/auth/server} for server configuration and type source
 * @see {@link authClient} for the singleton instance
 */
import { createAuthClient } from 'better-auth/client'

/**
 * Typed Better Auth client for browser session and credential operations.
 *
 * @remarks
 * Created once at module load. Methods return promises; failed auth operations
 * reject with Better Auth error objects rather than throwing synchronously.
 *
 * @example
 * ```typescript
 * import { authClient } from '@lib/auth/client'
 *
 * await authClient.signIn.email({
 *   email: 'user@example.com',
 *   password: 'secure-password',
 * })
 *
 * const { data: session } = await authClient.getSession()
 * ```
 */
export const authClient = createAuthClient()
