/**
 * Credential-based authentication via Better Auth.
 *
 * @module domains/auth/services/credentials-service
 * @remarks
 * Wraps Better Auth email/password endpoints for login and registration. Request headers
 * carry session cookies into Better Auth; returned headers must be forwarded on the HTTP
 * response so new sessions are persisted in the browser. All failures pass through
 * {@link mapBetterAuthError} for typed, security-conscious error messages.
 *
 * **Better Auth API calls**
 * - {@link credentialsService.login} → `auth.api.signInEmail`
 * - {@link credentialsService.register} → `auth.api.signUpEmail`
 *
 * @see {@link sessionService} — session read/terminate after successful sign-in
 * @see {@link loginSchema} — Zod validation for login payloads
 * @see {@link registerSchema} — Zod validation for registration payloads
 * @see {@link mapBetterAuthError} — error normalization layer
 */
import { auth } from '@lib/auth/server'
import type { LoginInput, RegisterInput } from '@domains/auth/schemas'
import { mapBetterAuthError } from '@domains/auth/utils/map-better-auth-error-util'

type AuthResult<T> = {
  data: T
  headers: Headers
}

/**
 * Better Auth wrapper for email/password sign-in and sign-up.
 *
 * @remarks
 * Each method calls the corresponding Better Auth server API with `returnHeaders: true`
 * so Set-Cookie headers from session creation are available to route handlers.
 *
 * @see {@link credentialsService.login} — `signInEmail`
 * @see {@link credentialsService.register} — `signUpEmail`
 *
 * @example
 * ```typescript
 * import { credentialsService } from '@domains/auth/services/credentials-service'
 *
 * const { data, headers } = await credentialsService.login(
 *   { email: 'user@example.com', password: 'securepass' },
 *   request.headers,
 * )
 * return new Response(JSON.stringify(data), { headers })
 * ```
 */
export const credentialsService = {
  /**
   * Authenticates a user with email and password via Better Auth `signInEmail`.
   *
   * @param input - Validated login credentials ({@link LoginInput})
   * @param requestHeaders - Incoming request headers containing session cookies
   * @returns Auth payload from Better Auth plus response headers to forward (including Set-Cookie)
   *
   * @throws {InvalidCredentialsError} When Better Auth rejects credentials (mapped from
   *   messages containing `"invalid"` and `"credential"`)
   * @throws {AuthError} When Better Auth returns an unmapped failure (e.g. `AUTH_REQUIRED`,
   *   `AUTH_FORBIDDEN`) via {@link mapBetterAuthError}
   *
   * @remarks
   * Calls `auth.api.signInEmail({ body, headers, returnHeaders: true })`. On success,
   * `data` contains the Better Auth sign-in response; `headers` must be merged into the
   * outgoing HTTP response for session cookies to persist.
   *
   * @see {@link loginSchema} — request validation before calling this method
   * @see {@link mapBetterAuthError} — converts raw Better Auth errors to domain errors
   * @see {@link mapErrorToHttp} — HTTP 401 for {@link InvalidCredentialsError}
   *
   * @example
   * ```typescript
   * const result = await credentialsService.login(
   *   { email: 'user@example.com', password: 'password123' },
   *   request.headers,
   * )
   * // Forward result.headers on the Response
   * ```
   */
  async login(
    input: LoginInput,
    requestHeaders: Headers
  ): Promise<AuthResult<unknown>> {
    try {
      const result = await auth.api.signInEmail({
        body: input,
        headers: requestHeaders,
        returnHeaders: true,
      })

      return {
        data: result.response,
        headers: result.headers,
      }
    } catch (error) {
      throw mapBetterAuthError(error)
    }
  },

  /**
   * Creates a new user account with email and password via Better Auth `signUpEmail`.
   *
   * @param input - Validated registration fields ({@link RegisterInput})
   * @param requestHeaders - Incoming request headers for session cookie context
   * @returns Auth payload from Better Auth plus response headers to forward (including Set-Cookie)
   *
   * @throws {RegistrationFailedError} When the account already exists or sign-up validation
   *   fails (mapped from messages containing `"already exists"` or `"duplicate"`)
   * @throws {AuthError} When Better Auth returns an unmapped failure via {@link mapBetterAuthError}
   *
   * @remarks
   * Calls `auth.api.signUpEmail({ body, headers, returnHeaders: true })`. Successful
   * registration may establish an authenticated session immediately; forward returned
   * headers so the client receives session cookies.
   *
   * @see {@link registerSchema} — request validation before calling this method
   * @see {@link mapBetterAuthError} — converts raw Better Auth errors to domain errors
   * @see {@link RegistrationFailedError} — duplicate email and validation failures
   *
   * @example
   * ```typescript
   * const result = await credentialsService.register(
   *   { email: 'new@example.com', password: 'password123', name: 'New User' },
   *   request.headers,
   * )
   * return new Response(JSON.stringify(result.data), { headers: result.headers })
   * ```
   */
  async register(
    input: RegisterInput,
    requestHeaders: Headers
  ): Promise<AuthResult<unknown>> {
    try {
      const result = await auth.api.signUpEmail({
        body: input,
        headers: requestHeaders,
        returnHeaders: true,
      })

      return {
        data: result.response,
        headers: result.headers,
      }
    } catch (error) {
      throw mapBetterAuthError(error)
    }
  },
}
