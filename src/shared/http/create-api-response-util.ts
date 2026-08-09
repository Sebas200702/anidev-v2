/**
 * Helpers for building and serializing the standard JSON API response envelope.
 *
 * @module shared/http/create-api-response-util
 * @remarks
 * Success and error paths share one envelope so Astro routes and clients can parse responses uniformly.
 * Errors are normalized through {@link mapErrorToHttp} before being placed in the envelope.
 *
 * **Envelope structure**
 * ```typescript
 * {
 *   data: T | null,    // Business payload; null on error
 *   status: number,    // HTTP status mirrored in JSON
 *   error?: string,    // Client-safe message when data is null
 *   code?: string,     // Stable error code when data is null
 *   meta?: Record<string, unknown>  // Extra fields (error details, pagination, etc.)
 * }
 * ```
 *
 * @see {@link createApiResponseSchema} — Zod validator for the same shape
 * @see {@link withErrorHandling} — route wrapper that uses these helpers end-to-end
 * @see {@link mapErrorToHttp}
 */

import { mapErrorToHttp } from '@shared/errors/map-error-to-http'
import type { ApiEnvelope } from './api-envelope-types'

/**
 * Builds a successful API envelope.
 *
 * @typeParam T - Type of the response payload
 * @param data - Serializable business data
 * @param status - HTTP status code written to `envelope.status`; defaults to `200`
 * @param meta - Optional metadata (page, total count, cache headers hints)
 * @returns Envelope with `data` set and no `error` field
 *
 * @example
 * ```typescript
 * const envelope = createSuccessResponse({ id: 1, title: 'Example' }, 200, { page: 1 })
 * // { data: { id: 1, title: 'Example' }, status: 200, meta: { page: 1 } }
 * ```
 *
 * @see {@link jsonResponse}
 */
export const createSuccessResponse = <T>(
  data: T,
  status = 200,
  meta: Record<string, unknown> = {}
): ApiEnvelope<T> => {
  return {
    data,
    status,
    meta,
  }
}

/**
 * Builds an error API envelope from any thrown value.
 *
 * @param error - Thrown value from handler, service, or middleware
 * @returns An `{ payload, headers }` pair: the envelope has `data: null`, `status` from
 *   {@link mapErrorToHttp}, `error` from mapped message, `code` (stable error code), `meta`
 *   from the mapper (often includes `details`); `headers` carries transport hints such as
 *   `Retry-After` for infra outages.
 *
 * @remarks
 * Does not report to Sentry itself — {@link mapErrorToHttp} handles Sentry for infra/unknown errors.
 *
 * @example
 * ```typescript
 * const { payload } = createErrorResponse(authRequired())
 * // { data: null, status: 401, error: 'Authentication required', code: 'AUTH_REQUIRED', meta: { details: undefined } }
 * ```
 *
 * @see {@link mapErrorToHttp}
 */
export const createErrorResponse = (
  error: unknown
): {
  payload: ApiEnvelope<null>
  headers?: Record<string, string>
} => {
  const { status, body, headers } = mapErrorToHttp(error)

  return {
    payload: {
      data: null,
      status,
      error: body.message ?? 'Unexpected error',
      code: body.code,
      meta: (body.meta as Record<string, unknown>) ?? {},
    },
    headers,
  }
}
// jsonResponse and mergeResponseHeaders are re-exported via the barrel at
// `@shared/http`. Import them from there or from `@shared/http/api-response-serialize-util` directly.
