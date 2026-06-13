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
 *   meta?: Record<string, unknown>  // Extra fields (error details, pagination, etc.)
 * }
 * ```
 *
 * @see {@link createApiResponseSchema} — Zod validator for the same shape
 * @see {@link withErrorHandling} — route wrapper that uses these helpers end-to-end
 * @see {@link mapErrorToHttp}
 */

import { mapErrorToHttp } from '@shared/errors/map-error-to-http'

/**
 * Standard JSON payload shape returned by API routes.
 *
 * @typeParam T - Type of the successful `data` payload
 */
export type ApiEnvelope<T> = {
  /** Response body on success; `null` when the handler failed or validation rejected the request. */
  data: T | null
  /** HTTP status code duplicated in the JSON body for client-side handling. */
  status: number
  /** Human-readable error message when `data` is `null`. */
  error?: string
  /** Optional metadata — pagination, or `details` from mapped errors in `meta`. */
  meta?: Record<string, unknown>
}

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
export function createSuccessResponse<T>(
  data: T,
  status = 200,
  meta: Record<string, unknown> = {}
): ApiEnvelope<T> {
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
 * @returns Envelope with `data: null`, `status` from {@link mapErrorToHttp}, `error` from mapped message,
 *   and `meta` from the mapper (often includes `details`)
 *
 * @remarks
 * Does not report to Sentry itself — {@link mapErrorToHttp} handles Sentry for infra/unknown errors.
 *
 * @example
 * ```typescript
 * const envelope = createErrorResponse(authRequired())
 * // { data: null, status: 401, error: 'Authentication required', meta: { details: undefined } }
 * ```
 *
 * @see {@link mapErrorToHttp}
 */
export function createErrorResponse(error: unknown): ApiEnvelope<null> {
  const { status, body } = mapErrorToHttp(error)

  return {
    data: null,
    status,
    error: body.message ?? 'Unexpected error',
    meta: (body.meta as Record<string, unknown>) ?? {},
  }
}

// Re-exported so consumers importing from `@shared/http/create-api-response-util` keep access to
// the envelope serialization helpers.
export * from '@shared/http/api-response-serialize-util'
