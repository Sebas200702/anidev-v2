/**
 * Per-class HTTP mapping helpers for the application error hierarchy.
 *
 * @module shared/errors/error-http-maps
 * @remarks Consumed by {@link mapErrorToHttp}. Each helper maps a specific {@link BaseError}
 * subclass to a status/body pair and performs the appropriate logging (no Sentry here; Sentry
 * capture for 500s happens in the top-level mapper).
 */

import { AuthError, BaseError, DomainError } from '@shared/errors/app-error'
import { ErrorCodes, type ErrorCode } from '@shared/errors/codes'
import type {
  HttpErrorBody,
  HttpErrorResponse,
} from '@shared/errors/http-error-types'
import { logger } from '@utils/logger-util'

/**
 * Auth error codes that map to **401 Unauthorized**.
 *
 * @remarks
 * Used by {@link mapAuthErrorToHttp}. All other recognized {@link AuthError} codes fall through
 * to {@link ErrorCodes.AUTH_FORBIDDEN} (403) when explicitly matched.
 *
 * @internal
 */
const UNAUTHORIZED_AUTH_CODES = new Set<ErrorCode>([
  ErrorCodes.AUTH_REQUIRED,
  ErrorCodes.AUTH_INVALID_TOKEN,
  ErrorCodes.AUTH_SESSION_EXPIRED,
])

/**
 * Domain error codes that map to **404 Not Found**.
 *
 * @remarks
 * Any other {@link DomainError} code maps to **400 Bad Request** and is logged at `error` severity.
 *
 * @internal
 */
const NOT_FOUND_DOMAIN_CODES = new Set<ErrorCode>([
  ErrorCodes.ANIME_NOT_FOUND,
  ErrorCodes.MUSIC_NOT_FOUND,
  ErrorCodes.WATCH_STATE_NOT_FOUND,
  ErrorCodes.COLLECTION_NOT_FOUND,
  ErrorCodes.USER_NOT_FOUND,
  ErrorCodes.MEDIA_NOT_FOUND,
])

/**
 * Builds the standard HTTP error body from a {@link BaseError} instance.
 *
 * @param error - Application error with `code`, `message`, and optional `details`
 * @returns Body where `meta.details` echoes `error.details` when defined
 *
 * @internal
 */
export function buildAppErrorBody(error: BaseError): HttpErrorBody {
  return {
    code: error.code,
    message: error.message,
    meta: { details: error.details },
  }
}

/**
 * Maps {@link AuthError} instances to 401 or 403 responses.
 *
 * @param error - Authentication or authorization failure
 * @returns HTTP response for recognized auth codes, or `undefined` if the code is not handled here
 *
 * @remarks
 * - **401**: `AUTH_REQUIRED`, `AUTH_INVALID_TOKEN`, `AUTH_SESSION_EXPIRED` — logged at `warn`.
 * - **403**: `AUTH_FORBIDDEN` — logged at `warn`.
 * - Unrecognized {@link AuthError} codes return `undefined` so {@link mapErrorToHttp} can fall through
 *   to generic unknown-error handling.
 *
 * @internal
 */
export function mapAuthErrorToHttp(
  error: AuthError
): HttpErrorResponse | undefined {
  if (UNAUTHORIZED_AUTH_CODES.has(error.code)) {
    logger.warn({ err: error }, 'Auth error - unauthorized')
    return {
      status: 401,
      body: buildAppErrorBody(error),
    }
  }

  if (error.code === ErrorCodes.AUTH_FORBIDDEN) {
    logger.warn({ err: error }, 'Auth error - forbidden')
    return {
      status: 403,
      body: buildAppErrorBody(error),
    }
  }

  return undefined
}

/**
 * Maps {@link DomainError} instances to 404 or 400 responses.
 *
 * @param error - Business-rule violation from domain logic
 * @returns **404** when `error.code` is in {@link NOT_FOUND_DOMAIN_CODES}; otherwise **400**
 *
 * @remarks
 * Not-found codes are logged at `warn`; other domain errors at `error`. Neither path reports to Sentry.
 *
 * @internal
 */
export function mapDomainErrorToHttp(error: DomainError): HttpErrorResponse {
  if (NOT_FOUND_DOMAIN_CODES.has(error.code)) {
    logger.warn({ err: error }, 'Domain error - not found')
    return {
      status: 404,
      body: buildAppErrorBody(error),
    }
  }

  logger.error({ err: error }, 'Domain error')
  return {
    status: 400,
    body: buildAppErrorBody(error),
  }
}
