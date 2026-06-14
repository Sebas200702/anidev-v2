/**
 * Standard JSON payload shape returned by API routes.
 *
 * @module shared/http/api-envelope
 * @remarks
 * Extracted from {@link create-api-response-util} so both envelope builders and
 * serialization helpers can import it without circular dependencies.
 *
 * @typeParam T - Type of the successful `data` payload
 * @see {@link module:shared/http/create-api-response-util} — `createSuccessResponse` / `createErrorResponse`
 * @see {@link module:shared/http/api-response-serialize-util} — `jsonResponse` / `mergeResponseHeaders`
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
