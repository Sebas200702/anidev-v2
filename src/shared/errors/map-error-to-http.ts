/**
 * Maps typed application errors to HTTP status codes, JSON error bodies, logging, and Sentry reporting.
 *
 * @module shared/errors/map-error-to-http
 * @remarks
 * This module is the single bridge between the {@link BaseError} hierarchy and HTTP API responses.
 * Route wrappers such as {@link withErrorHandling} and {@link withZodValidation} rely on
 * {@link mapErrorToHttp} (directly or via {@link createErrorResponse}) so clients always receive
 * a consistent `{ code, message, meta }` error body shape.
 *
 * **HTTP status mapping overview**
 *
 * | Status | Error class / condition | Error codes (representative) |
 * |--------|-------------------------|------------------------------|
 * | 400 | {@link ValidationError} | `VALIDATION_ERROR` |
 * | 400 | {@link DomainError} (non-not-found) | `ANIME_INVALID_ID`, `MUSIC_INVALID_ID`, `USER_INVALID_ID`, `INVALID_IMAGE_PATH`, … |
 * | 401 | {@link AuthError} (unauthorized) | `AUTH_REQUIRED`, `AUTH_INVALID_TOKEN`, `AUTH_SESSION_EXPIRED` |
 * | 403 | {@link AuthError} (forbidden) | `AUTH_FORBIDDEN` |
 * | 404 | {@link DomainError} (not found) | `ANIME_NOT_FOUND`, `MUSIC_NOT_FOUND`, `WATCH_STATE_NOT_FOUND`, `COLLECTION_NOT_FOUND`, `USER_NOT_FOUND`, `MEDIA_NOT_FOUND` |
 * | 500 | {@link InfraError} | `DB_ERROR`, `CACHE_ERROR`, `EXTERNAL_API_ERROR` |
 * | 500 | Unknown / non-{@link BaseError} throwables | `UNKNOWN_ERROR` |
 *
 * **Sentry behavior**
 * - {@link InfraError}: always reported via `SentryNode.captureException` before returning 500.
 * - Unknown errors: reported via `SentryNode.captureException` before returning 500 with `UNKNOWN_ERROR`.
 * - {@link ValidationError}, {@link AuthError}, and {@link DomainError}: logged only (no Sentry).
 *
 * **Response body shape** (`HttpErrorBody`)
 * - `code` — stable {@link ErrorCode} string from the error instance.
 * - `message` — human-readable text; for {@link InfraError} and unknown errors the client sees a generic
 *   `"Internal server error"` while the original message remains in logs.
 * - `meta.details` — optional structured context from `error.details` (validation issues, entity ids, etc.).
 *
 * @see {@link mapErrorToHttp} — public entry point
 * @see {@link createErrorResponse} — wraps this mapper into the API envelope
 * @see {@link withZodValidation} — returns 400 validation responses using the same body shape
 * @see {@link ErrorCodes} — full list of stable error identifiers
 */

import {
  AuthError,
  BaseError,
  DomainError,
  InfraError,
  ValidationError,
} from '@shared/errors/app-error'
import { ErrorCodes, type ErrorCode } from '@shared/errors/codes'
import { logger } from '@utils/logger-util'
import * as SentryNode from '@sentry/node'

/**
 * JSON-serializable error payload returned in HTTP responses.
 *
 * @remarks
 * Serialized as the `body` half of {@link HttpErrorResponse}. The `meta.details` field mirrors
 * `BaseError.details` when present; it may contain Zod issue arrays, entity identifiers, or
 * operation names depending on which factory or class created the error.
 */
type HttpErrorBody = {
  /** Stable application error code (e.g. `ANIME_NOT_FOUND`). */
  code: string
  /** Human-readable message safe to expose to API clients (may be generic for 500 responses). */
  message: string
  /** Optional wrapper; `details` holds structured context from the originating error. */
  meta?: Record<string, unknown>
}

/**
 * HTTP status plus structured error body produced by the mapper.
 */
type HttpErrorResponse = {
  /** HTTP status code (400, 401, 403, 404, or 500). */
  status: number
  /** JSON error body with `code`, `message`, and optional `meta`. */
  body: HttpErrorBody
}

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
])

/**
 * Builds the standard HTTP error body from a {@link BaseError} instance.
 *
 * @param error - Application error with `code`, `message`, and optional `details`
 * @returns Body where `meta.details` echoes `error.details` when defined
 *
 * @internal
 */
function buildAppErrorBody(error: BaseError): HttpErrorBody {
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
function mapAuthErrorToHttp(error: AuthError): HttpErrorResponse | undefined {
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
function mapDomainErrorToHttp(error: DomainError): HttpErrorResponse {
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

/**
 * Converts a thrown value into an HTTP status and structured JSON error body.
 *
 * @param error - Any value thrown from route handlers, services, or middleware
 * @returns {@link HttpErrorResponse} with status and `body` suitable for `Response.json` / envelope serialization
 *
 * @remarks
 * **Dispatch order** (first match wins):
 * 1. {@link ValidationError} → 400, `warn` log
 * 2. {@link AuthError} → 401 / 403 via {@link mapAuthErrorToHttp}, or fall through if unhandled
 * 3. {@link DomainError} → 404 / 400 via {@link mapDomainErrorToHttp}
 * 4. {@link InfraError} → 500, `error` log, **Sentry capture**, generic client message
 * 5. Everything else → 500, `error` log, **Sentry capture**, `UNKNOWN_ERROR` code
 *
 * **Client-visible messages on 500**
 * - {@link InfraError}: `message` is replaced with `"Internal server error"`; original message and `details` stay in logs/Sentry.
 * - Unknown: `code` is `UNKNOWN_ERROR`, `message` is `"Internal server error"`, no `meta.details`.
 *
 * @example
 * ```typescript
 * import { mapErrorToHttp } from '@shared/errors/map-error-to-http'
 * import { authRequired } from '@shared/errors/auth-errors'
 *
 * const { status, body } = mapErrorToHttp(authRequired())
 * // status === 401
 * // body === { code: 'AUTH_REQUIRED', message: 'Authentication required', meta: { details: undefined } }
 * ```
 *
 * @see {@link createErrorResponse} — API envelope wrapper
 * @see {@link withErrorHandling} — Astro route wrapper using envelopes
 */
export function mapErrorToHttp(error: unknown): HttpErrorResponse {
  if (error instanceof ValidationError) {
    logger.warn({ err: error }, 'Validation error')
    return {
      status: 400,
      body: buildAppErrorBody(error),
    }
  }

  if (error instanceof AuthError) {
    const authResponse = mapAuthErrorToHttp(error)
    if (authResponse) {
      return authResponse
    }
  }

  if (error instanceof DomainError) {
    return mapDomainErrorToHttp(error)
  }

  if (error instanceof InfraError) {
    logger.error({ err: error }, 'Infra error')
    SentryNode.captureException(error)

    return {
      status: 500,
      body: {
        code: error.code,
        message: 'Internal server error',
        meta: { details: error.details },
      },
    }
  }

  logger.error({ err: error }, 'Unknown error')
  SentryNode.captureException(error as Error)

  return {
    status: 500,
    body: { code: ErrorCodes.UNKNOWN_ERROR, message: 'Internal server error' },
  }
}
