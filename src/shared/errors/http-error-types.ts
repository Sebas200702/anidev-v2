/**
 * HTTP error payload types shared by the error-to-HTTP mapper.
 *
 * @module shared/errors/http-error-types
 * @remarks Defines the serialized `{ code, message, meta }` body and the `{ status, body }`
 * envelope produced by {@link mapErrorToHttp}.
 */

/**
 * JSON-serializable error payload returned in HTTP responses.
 *
 * @remarks
 * Serialized as the `body` half of {@link HttpErrorResponse}. The `meta.details` field mirrors
 * `BaseError.details` when present; it may contain Zod issue arrays, entity identifiers, or
 * operation names depending on which factory or class created the error.
 */
export type HttpErrorBody = {
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
export type HttpErrorResponse = {
  /** HTTP status code (400, 401, 403, 404, or 500). */
  status: number
  /** JSON error body with `code`, `message`, and optional `meta`. */
  body: HttpErrorBody
}
