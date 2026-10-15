/**
 * Per-class HTTP mapping helpers for the application error hierarchy.
 *
 * @module shared/errors/error-http-maps
 * @remarks Consumed by {@link mapErrorToHttp}. Each helper maps a specific {@link BaseError}
 * subclass to a status/body pair and performs the appropriate logging (no Sentry here; Sentry
 * capture for every mapped error happens in the top-level mapper via {@link captureError}).
 */

import type {
  AuthError,
  DomainError,
  InfraError,
  RateLimitedError,
  ResponseValidationError,
} from '@shared/errors/app-error'
import { BaseError } from '@shared/errors/base-error'
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
 * Domain error codes that map to **409 Conflict**.
 *
 * @remarks
 * Any other {@link DomainError} code maps to **400 Bad Request**.
 *
 * @internal
 */
const CONFLICT_DOMAIN_CODES = new Set<ErrorCode>([
  ErrorCodes.USER_PROFILE_CONFLICT,
])

/**
 * Extracts the log-safe shape of an application error.
 *
 * @param error - Application error which may carry PII in `details`/`cause`
 * @returns `{ name, code, message, stack }` — stack kept for debugging,
 * `details`/`cause` dropped (Sentry already receives the full error via
 * {@link captureError})
 *
 * @internal
 */
export const toLoggableError = (error: unknown) =>
  error instanceof BaseError
    ? {
        name: error.name,
        code: error.code,
        message: error.message,
        stack: error.stack,
      }
    : error instanceof Error
      ? { name: error.name, message: error.message, stack: error.stack }
      : { message: String(error) }

/**
 * Builds the standard HTTP error body from a {@link BaseError} instance.
 *
 * @param error - Application error with `code`, `message`, and optional `details`
 * @returns Body where `meta.details` echoes `error.details` when defined
 *
 * @internal
 */
export const buildAppErrorBody = (error: BaseError): HttpErrorBody => {
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
export const mapAuthErrorToHttp = (
  error: AuthError
): HttpErrorResponse | undefined => {
  if (UNAUTHORIZED_AUTH_CODES.has(error.code)) {
    logger.warn({ err: toLoggableError(error) }, 'Auth error - unauthorized')
    return {
      status: 401,
      body: buildAppErrorBody(error),
    }
  }

  if (error.code === ErrorCodes.AUTH_FORBIDDEN) {
    logger.warn({ err: toLoggableError(error) }, 'Auth error - forbidden')
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
 * Not-found codes are logged at `warn`; other domain errors at `error`. Neither path reports
 * to Sentry here — capture happens once in the top-level mapper.
 *
 * @internal
 */
export const mapDomainErrorToHttp = (error: DomainError): HttpErrorResponse => {
  if (NOT_FOUND_DOMAIN_CODES.has(error.code)) {
    logger.warn({ err: toLoggableError(error) }, 'Domain error - not found')
    return {
      status: 404,
      body: buildAppErrorBody(error),
    }
  }

  if (CONFLICT_DOMAIN_CODES.has(error.code)) {
    logger.warn({ err: toLoggableError(error) }, 'Domain error - conflict')
    return {
      status: 409,
      body: buildAppErrorBody(error),
    }
  }

  logger.error({ err: toLoggableError(error) }, 'Domain error')
  return {
    status: 400,
    body: buildAppErrorBody(error),
  }
}

/** Seconds a client/load balancer should wait before retrying a 503 response. */
export const INFRA_RETRY_AFTER_SECONDS = 30

/**
 * Maps {@link RateLimitedError} to a 429 response with `Retry-After`.
 *
 * @param error - Rate limit rejection with retry hint
 * @returns **429** with client-safe message
 *
 * @internal
 */
export const mapRateLimitedErrorToHttp = (
  error: RateLimitedError
): HttpErrorResponse => {
  logger.warn({ err: toLoggableError(error) }, 'Rate limited')
  return {
    status: 429,
    headers: {
      'Retry-After': String(error.retryAfterSeconds),
    },
    body: {
      code: error.code,
      message: 'Too many requests',
    },
  }
}

/**
 * Maps {@link ResponseValidationError} to a generic 500 response.
 *
 * @param error - Server-side contract violation (schema issues stay in logs)
 * @returns **500** with `Internal server error`
 *
 * @internal
 */
export const mapResponseValidationErrorToHttp = (
  error: ResponseValidationError
): HttpErrorResponse => {
  logger.error({ err: toLoggableError(error) }, 'Response validation error')
  return {
    status: 500,
    body: {
      code: error.code,
      message: 'Internal server error',
    },
  }
}

/**
 * Maps {@link InfraError} to a 503 response with `Retry-After`.
 *
 * @param error - Infrastructure failure (details hidden from clients)
 * @returns **503** with `Service unavailable`
 *
 * @internal
 */
export const mapInfraErrorToHttp = (error: InfraError): HttpErrorResponse => {
  logger.error({ err: toLoggableError(error) }, 'Infra error')
  return {
    status: 503,
    headers: {
      'Retry-After': String(INFRA_RETRY_AFTER_SECONDS),
    },
    body: {
      code: error.code,
      message: 'Service unavailable',
      meta: {},
    },
  }
}

/**
 * Maps unknown throwables to a generic 500 response.
 *
 * @param error - Any non-{@link BaseError} value
 * @returns **500** with `UNKNOWN_ERROR`
 *
 * @internal
 */
export const mapUnknownToHttp = (error: unknown): HttpErrorResponse => {
  logger.error({ err: toLoggableError(error) }, 'Unknown error')
  return {
    status: 500,
    body: { code: ErrorCodes.UNKNOWN_ERROR, message: 'Internal server error' },
  }
}
