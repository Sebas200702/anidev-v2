/**
 * Maps Better Auth errors to domain-specific auth errors.
 *
 * @module domains/auth/utils/map-better-auth-error-util
 * @remarks
 * Central error normalization layer between Better Auth server API calls and the
 * application's {@link AuthError} hierarchy. Inspects lowercased error messages from
 * Better Auth and returns typed errors suitable for {@link mapErrorToHttp}.
 *
 * **Message pattern mapping** (case-insensitive substring match on `error.message`):
 *
 * | Pattern | Domain error | Error code | HTTP via {@link mapErrorToHttp} |
 * |---------|--------------|------------|----------------------------------|
 * | contains `"invalid"` **and** `"credential"` | {@link InvalidCredentialsError} | `AUTH_INVALID_TOKEN` | **401** Unauthorized |
 * | contains `"session"` **and** `"expired"` | {@link SessionExpiredError} | `AUTH_SESSION_EXPIRED` | **401** Unauthorized |
 * | contains `"already exists"` **or** `"duplicate"` | {@link RegistrationFailedError} | `VALIDATION_ERROR` | validation semantic |
 * | contains `"unauthorized"` **or** `"forbidden"` | {@link AuthError} | `AUTH_FORBIDDEN` | **403** Forbidden |
 * | non-`Error` value or unmatched `Error` | {@link AuthError} | `AUTH_REQUIRED` | **401** Unauthorized |
 *
 * Original Better Auth errors are preserved in `details` on domain error instances
 * for server-side logging without exposing raw messages to clients.
 *
 * @see {@link credentialsService} — login/register error consumer
 * @see {@link sessionService} — session lookup/logout error consumer
 * @see {@link mapErrorToHttp} — HTTP status mapping for returned errors
 */
import { AuthError } from '@shared/errors/app-error'
import { ErrorCodes } from '@shared/errors/codes'
import {
  InvalidCredentialsError,
  RegistrationFailedError,
  SessionExpiredError,
} from '@domains/auth/errors'

/**
 * Normalizes Better Auth failures into typed application auth errors.
 *
 * @param error - Raw thrown value from Better Auth `signInEmail`, `signUpEmail`,
 *   `getSession`, or `signOut`
 * @returns A domain {@link AuthError} subclass (or generic {@link AuthError}) suitable
 *   for {@link mapErrorToHttp}; never re-throws the original value
 *
 * @remarks
 * **Matching rules** (evaluated only when `error instanceof Error`):
 * 1. `"invalid"` + `"credential"` → {@link InvalidCredentialsError} with original error in `details`
 * 2. `"session"` + `"expired"` → {@link SessionExpiredError} with original error in `details`
 * 3. `"already exists"` or `"duplicate"` → {@link RegistrationFailedError} with Better Auth message
 * 4. `"unauthorized"` or `"forbidden"` → {@link AuthError} with {@link ErrorCodes.AUTH_FORBIDDEN}
 * 5. Fallback (non-Error or no pattern match) → {@link AuthError} with
 *    {@link ErrorCodes.AUTH_REQUIRED} and message `"Authentication failed"`
 *
 * @see {@link InvalidCredentialsError}
 * @see {@link SessionExpiredError}
 * @see {@link RegistrationFailedError}
 * @see {@link mapErrorToHttp}
 *
 * @example
 * ```typescript
 * import { mapBetterAuthError } from '@domains/auth/utils/map-better-auth-error-util'
 *
 * try {
 *   await auth.api.signInEmail({ body, headers })
 * } catch (error) {
 *   throw mapBetterAuthError(error) // InvalidCredentialsError for bad password
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Duplicate email during sign-up
 * mapBetterAuthError(new Error('User already exists'))
 * // → RegistrationFailedError { code: 'VALIDATION_ERROR', message: 'User already exists' }
 * ```
 *
 * @example
 * ```typescript
 * // Unmatched error
 * mapBetterAuthError(new Error('Network timeout'))
 * // → AuthError { code: 'AUTH_REQUIRED', message: 'Authentication failed' }
 * ```
 */
export function mapBetterAuthError(error: unknown): Error {
  if (error instanceof Error) {
    const message = error.message.toLowerCase()

    if (message.includes('invalid') && message.includes('credential')) {
      return new InvalidCredentialsError(error)
    }

    if (message.includes('session') && message.includes('expired')) {
      return new SessionExpiredError(error)
    }

    if (message.includes('already exists') || message.includes('duplicate')) {
      return new RegistrationFailedError(error.message, error)
    }

    if (message.includes('unauthorized') || message.includes('forbidden')) {
      return new AuthError(ErrorCodes.AUTH_FORBIDDEN, error.message)
    }
  }

  return new AuthError(
    ErrorCodes.AUTH_REQUIRED,
    'Authentication failed',
    error
  )
}
