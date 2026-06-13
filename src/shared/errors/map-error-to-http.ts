/**
 * Maps typed application errors to HTTP status codes, JSON error bodies, logging, and Sentry reporting.
 *
 * @module shared/errors/map-error-to-http
 * @remarks
 * This module is the single bridge between the {@link BaseError} hierarchy and HTTP API responses.
 * Route wrappers such as {@link withErrorHandling} and {@link withZodValidation} rely on
 * {@link mapErrorToHttp} (directly or via {@link createErrorResponse}) so clients always receive
 * a consistent `{ code, message, meta }` error body shape. Per-class mapping helpers live in
 * {@link error-http-maps}; payload types in {@link http-error-types}.
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
  DomainError,
  InfraError,
  ValidationError,
} from '@shared/errors/app-error'
import { ErrorCodes } from '@shared/errors/codes'
import type { HttpErrorResponse } from '@shared/errors/http-error-types'
import {
  buildAppErrorBody,
  mapAuthErrorToHttp,
  mapDomainErrorToHttp,
} from '@shared/errors/error-http-maps'
import { logger } from '@utils/logger-util'
import * as SentryNode from '@sentry/node'

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
