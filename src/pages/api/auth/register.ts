/**
 * User registration API endpoint.
 *
 * @module pages/api/auth/register
 *
 * **Route:** `POST /api/auth/register`
 *
 * **Authentication:** Public — no session required. Clears any stale session locals
 * before account creation ({@link onRequest} middleware).
 *
 * Creates a new user account with email and password via Better Auth, establishes
 * a session, and returns `Set-Cookie` headers for subsequent authenticated requests.
 *
 * @see {@link registerSchema} — request validation schema
 * @see {@link credentialsService.register} — Better Auth sign-up service
 * @see {@link mapErrorToHttp} — error-to-HTTP mapping via {@link withErrorHandling}
 */

import type { APIRoute } from 'astro'
import { withZodValidation } from '@http/with-validation'
import { withErrorHandling } from '@http/with-error-handling'
import { registerSchema } from '@domains/auth/schemas'
import { credentialsService } from '@domains/auth/services'

/**
 * Registers a new user account with email, password, and display name.
 *
 * @remarks
 * **Request**
 *
 * | Source | Field | Type | Required | Description |
 * |--------|-------|------|----------|-------------|
 * | Body | `email` | `string` | Yes | Valid email address |
 * | Body | `password` | `string` | Yes | Password (minimum 8 characters) |
 * | Body | `name` | `string` | Yes | Display name (minimum 1 character) |
 *
 * **Success response — `201 Created`**
 *
 * ```typescript
 * {
 *   data: unknown // Better Auth sign-up payload (user + session)
 *   status: 201
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
 * | 400 | `VALIDATION_ERROR` | Request body fails {@link registerSchema} validation, or account already exists |
 * | 401 | `AUTH_REQUIRED` | Better Auth returns an unmapped authentication failure |
 * | 403 | `AUTH_FORBIDDEN` | Better Auth rejects the request as unauthorized/forbidden |
 * | 500 | `DB_ERROR` | Database error during registration |
 * | 500 | `UNKNOWN_ERROR` | Unhandled throwable |
 *
 * @example
 * ```bash
 * curl -X POST "http://localhost:4321/api/auth/register" \
 *   -H "Content-Type: application/json" \
 *   -d '{"email":"new@example.com","password":"secret123","name":"New User"}' \
 *   -c cookies.txt
 * ```
 *
 * @example
 * ```typescript
 * const res = await fetch('/api/auth/register', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     email: 'new@example.com',
 *     password: 'secret123',
 *     name: 'New User',
 *   }),
 *   credentials: 'include',
 * })
 * const { data, status } = await res.json()
 * // status: 201, Set-Cookie headers establish session
 * ```
 */
export const POST: APIRoute = withZodValidation(registerSchema)(
  withErrorHandling(async ({ request, validated }) => {
    const result = await credentialsService.register(
      validated.body,
      request.headers
    )

    return {
      data: result.data,
      status: 201,
      meta: {},
      headers: result.headers,
    }
  })
)
