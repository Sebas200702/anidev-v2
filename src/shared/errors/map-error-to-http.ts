/**
 * Maps typed application errors to HTTP status codes, JSON error bodies, logging, and Sentry reporting.
 *
 * @module shared/errors/map-error-to-http
 * @remarks
 * Thin dispatcher over the per-class helpers in {@link error-http-maps}:
 * validation/auth/domain map inline, server-side classes delegate. Sentry
 * capture happens here once per error so helpers stay capture-free.
 *
 * **Dispatch order** (first match wins): `ValidationError` → `AuthError` →
 * `DomainError` → `RateLimitedError` → `ResponseValidationError` →
 * `InfraError` → unknown. Client-caused classes capture at `warning`, server
 * classes and unknowns at `error`.
 *
 * @see {@link mapErrorToHttp} — public entry point
 * @see {@link createErrorResponse} — API envelope wrapper
 * @see {@link withErrorHandling} — Astro route wrapper using envelopes
 */

import {
  AuthError,
  DomainError,
  InfraError,
  RateLimitedError,
  ResponseValidationError,
  ValidationError,
} from '@shared/errors/app-error'
import { captureError } from '@shared/errors/capture-error'
import type { HttpErrorResponse } from '@shared/errors/http-error-types'
import {
  buildAppErrorBody,
  mapAuthErrorToHttp,
  mapDomainErrorToHttp,
  mapInfraErrorToHttp,
  mapRateLimitedErrorToHttp,
  mapResponseValidationErrorToHttp,
  mapUnknownToHttp,
  toLoggableError,
} from '@shared/errors/error-http-maps'
import { logger } from '@utils/logger-util'

export { INFRA_RETRY_AFTER_SECONDS } from '@shared/errors/error-http-maps'

/**
 * Converts a thrown value into an HTTP status and structured JSON error body.
 *
 * @param error - Any value thrown from route handlers, services, or middleware
 * @returns {@link HttpErrorResponse} with status and `body` suitable for `Response.json` / envelope serialization
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
export const mapErrorToHttp = (error: unknown): HttpErrorResponse => {
  if (error instanceof ValidationError) {
    logger.warn({ err: toLoggableError(error) }, 'Validation error')
    captureError(error, 'warning')
    return {
      status: 400,
      body: buildAppErrorBody(error),
    }
  }

  if (error instanceof AuthError) {
    const authResponse = mapAuthErrorToHttp(error)
    if (authResponse) {
      captureError(error, 'warning')
      return authResponse
    }
  }

  if (error instanceof DomainError) {
    captureError(error, 'warning')
    return mapDomainErrorToHttp(error)
  }

  if (error instanceof RateLimitedError) {
    captureError(error, 'warning')
    return mapRateLimitedErrorToHttp(error)
  }

  if (error instanceof ResponseValidationError) {
    captureError(error)
    return mapResponseValidationErrorToHttp(error)
  }

  if (error instanceof InfraError) {
    captureError(error)
    return mapInfraErrorToHttp(error)
  }

  captureError(error)
  return mapUnknownToHttp(error)
}
