/**
 * @module @domains/media/types/media-request-types
 * @remarks HTTP request shapes for the media proxy route: catch-all path params, transform query
 * params, and the combined validated request. Inferred alongside {@link mediaRequestSchema}.
 */

/**
 * Optional width and quality query params for media routes.
 *
 * @remarks Validated by {@link mediaRequestSchema} as `w` and `q` query keys.
 * @see {@link MediaRequest.query}
 * @example
 * ```typescript
 * const query: MediaRequestQuery = { w: 400, q: 75 }
 * ```
 */
export interface MediaRequestQuery {
  /** Target output width in pixels. */
  w?: number
  /** Output quality from 1–100. */
  q?: number
}

/**
 * Catch-all media route path parameter.
 *
 * @remarks Contains the path segment after `/media/` without the leading slash.
 * @see {@link MediaRequest.params}
 * @example
 * ```typescript
 * const params: MediaRequestParams = { path: 'anime/5114/poster/large' }
 * ```
 */
export interface MediaRequestParams {
  /** Catch-all media path segments. */
  path: string
}

/**
 * Validated media proxy request shape.
 *
 * @remarks Inferred from {@link mediaRequestSchema}. Combines path params, transform query
 * params, and an optional body for future extensibility.
 * @see {@link mediaRequestSchema} for runtime validation
 * @example
 * ```typescript
 * const request: MediaRequest = {
 *   params: { path: 'anime/5114/poster/large' },
 *   query: { w: 400, q: 75 },
 * }
 * ```
 */
export interface MediaRequest {
  /** Catch-all path parameter object. */
  params: MediaRequestParams
  /** Optional width/quality transform query params. */
  query: MediaRequestQuery
  /** Optional request body (unused by GET media routes). */
  body?: unknown
}
