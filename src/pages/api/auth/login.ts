/**
 * User login API endpoint.
 *
 * @module pages/api/auth/login
 *
 * **Route:** `POST /api/auth/login`
 *
 * **Authentication:** Public — no session required. Clears any stale session locals
 * before credential exchange ({@link onRequest} middleware).
 *
 * Authenticates a user with email and password via Better Auth, establishes a session,
 * and returns `Set-Cookie` headers for subsequent authenticated requests.
 *
 * @see {@link loginSchema} — request validation schema
 * @see {@link credentialsService.login} — Better Auth sign-in service
 * @see {@link mapErrorToHttp} — error-to-HTTP mapping via {@link withErrorHandling}
 */

import type { APIRoute, APIContext } from 'astro'
import { withZodValidation } from '@http/with-validation'
import { withErrorHandling } from '@http/with-error-handling'
import { loginSchema, type LoginInput } from '@auth/schemas'
import { credentialsService } from '@auth/services'
import {
  checkCredentialLockout,
  clearCredentialFailures,
  getClientIpFromHeaders,
  recordCredentialFailure,
} from '@auth/services/credential-throttle'
import { InvalidCredentialsError } from '@auth/errors'
import { RateLimitedError } from '@shared/errors/app-error'

/**
 * Signs in a user with email and password credentials.
 *
 * @remarks
 * **Request**
 *
 * | Source | Field | Type | Required | Description |
 * |--------|-------|------|----------|-------------|
 * | Body | `email` | `string` | Yes | Valid email address |
 * | Body | `password` | `string` | Yes | Password (minimum 8 characters) |
 *
 * **Success response — `200 OK`**
 *
 * ```typescript
 * {
 *   data: unknown // Better Auth sign-in payload (user + session)
 *   status: 200
 *   meta: {}
 * }
 * ```
 *
 * Response includes `Set-Cookie` headers forwarded from Better Auth for session persistence.
 *
 * **Error responses** (JSON envelope: `{ data: null, status, error, meta }`)
 *
 * | Status | Code | When |
 * |--------|------|------|
 * | 400 | `VALIDATION_ERROR` | Request body fails {@link loginSchema} validation |
 * | 401 | `AUTH_INVALID_TOKEN` | Email or password is incorrect |
 * | 401 | `AUTH_REQUIRED` | Better Auth returns an unmapped authentication failure |
 * | 401 | `AUTH_SESSION_EXPIRED` | Existing session token is expired during sign-in |
 * | 403 | `AUTH_FORBIDDEN` | Better Auth rejects the request as unauthorized/forbidden |
 * | 500 | `DB_ERROR` | Database error during authentication |
 * | 500 | `UNKNOWN_ERROR` | Unhandled throwable |
 *
 * @example
 * ```bash
 * curl -X POST "http://localhost:4321/api/auth/login" \
 *   -H "Content-Type: application/json" \
 *   -d '{"email":"user@example.com","password":"secret123"}' \
 *   -c cookies.txt
 * ```
 *
 * @example
 * ```typescript
 * const res = await fetch('/api/auth/login', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ email: 'user@example.com', password: 'secret123' }),
 *   credentials: 'include',
 * })
 * const { data, status } = await res.json()
 * // status: 200, Set-Cookie headers establish session
 * ```
 */
export const POST: APIRoute = withZodValidation(loginSchema)(
  withErrorHandling(
    async ({
      request,
      validated,
    }: APIContext & {
      validated: { body: LoginInput }
    }) => {
      const ip = getClientIpFromHeaders(request.headers)
      const email = validated.body.email
      const lockout = await checkCredentialLockout(ip, email)
      if (lockout.locked) {
        throw new RateLimitedError(lockout.retryAfter)
      }

      try {
        const result = await credentialsService.login(
          validated.body,
          request.headers
        )

        await clearCredentialFailures(ip, email)

        const sanitizedData =
          result.data &&
          typeof result.data === 'object' &&
          !Array.isArray(result.data)
            ? (() => {
                const { token: _token, ...rest } = result.data as Record<
                  string,
                  unknown
                >
                return rest
              })()
            : result.data

        return {
          data: sanitizedData,
          status: 200,
          meta: {},
          headers: result.headers,
        }
      } catch (error) {
        if (error instanceof InvalidCredentialsError) {
          await recordCredentialFailure(ip, email)
        }
        throw error
      }
    }
  )
)
