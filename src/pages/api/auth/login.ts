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

import type { APIRoute } from 'astro'
import { withZodValidation } from '@http/with-validation'
import { withErrorHandling } from '@http/with-error-handling'
import { loginSchema } from '@domains/auth/schemas'
import { credentialsService } from '@domains/auth/services'

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
  withErrorHandling(async ({ request, validated }) => {
    const result = await credentialsService.login(
      validated.body,
      request.headers
    )

    return {
      data: result.data,
      status: 200,
      meta: {},
      headers: result.headers,
    }
  })
)
