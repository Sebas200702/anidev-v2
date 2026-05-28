/**
 * Factory helpers for authentication and authorization {@link AuthError} instances.
 *
 * @module shared/errors/auth-errors
 * @remarks
 * Prefer these factories over `new AuthError(...)` so messages and codes stay consistent.
 * Throw or return the result from services/middleware; {@link mapErrorToHttp} maps codes to HTTP status.
 *
 * **HTTP mapping** (via {@link mapErrorToHttp})
 * | Factory | Code | HTTP |
 * |---------|------|------|
 * | {@link authRequired} | `AUTH_REQUIRED` | 401 |
 * | {@link authInvalidToken} | `AUTH_INVALID_TOKEN` | 401 |
 * | {@link authSessionExpired} | `AUTH_SESSION_EXPIRED` | 401 |
 * | {@link authForbidden} | `AUTH_FORBIDDEN` | 403 |
 *
 * **Details shape**
 * Optional `details` is passed through to `AuthError.details` and exposed as `meta.details` in API responses.
 *
 * @see {@link AuthError}
 * @see {@link mapErrorToHttp}
 */

import { AuthError } from '@shared/errors/app-error'
import { ErrorCodes } from '@shared/errors/codes'

/**
 * Creates an error when a protected resource is accessed without credentials.
 *
 * @param details - Optional structured context (route name, required scope) for logs or clients
 * @returns An {@link AuthError} with code `AUTH_REQUIRED` → HTTP **401**
 *
 * @remarks
 * Use when no session or bearer token is present on a route that requires authentication.
 *
 * @see {@link mapErrorToHttp}
 */
export function authRequired(details?: unknown) {
  return new AuthError(
    ErrorCodes.AUTH_REQUIRED,
    'Authentication required',
    details
  )
}

/**
 * Creates an error when the provided authentication token is invalid or malformed.
 *
 * @param details - Optional structured context (token type, validation failure reason)
 * @returns An {@link AuthError} with code `AUTH_INVALID_TOKEN` → HTTP **401**
 *
 * @see {@link mapErrorToHttp}
 */
export function authInvalidToken(details?: unknown) {
  return new AuthError(
    ErrorCodes.AUTH_INVALID_TOKEN,
    'Invalid or malformed authentication token',
    details
  )
}

/**
 * Creates an error when the user's session has expired and must sign in again.
 *
 * @param details - Optional structured context (expired at, session id prefix)
 * @returns An {@link AuthError} with code `AUTH_SESSION_EXPIRED` → HTTP **401**
 *
 * @see {@link mapErrorToHttp}
 */
export function authSessionExpired(details?: unknown) {
  return new AuthError(
    ErrorCodes.AUTH_SESSION_EXPIRED,
    'Session has expired, please log in again',
    details
  )
}

/**
 * Creates an error when the authenticated user lacks permission for the requested action.
 *
 * @param details - Optional structured context (resource, required role)
 * @returns An {@link AuthError} with code `AUTH_FORBIDDEN` → HTTP **403**
 *
 * @remarks
 * Distinct from {@link authRequired}: the user is authenticated but not authorized for this operation.
 *
 * @see {@link mapErrorToHttp}
 */
export function authForbidden(details?: unknown) {
  return new AuthError(
    ErrorCodes.AUTH_FORBIDDEN,
    'You do not have permission to perform this action',
    details
  )
}
