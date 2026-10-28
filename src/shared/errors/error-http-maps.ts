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
