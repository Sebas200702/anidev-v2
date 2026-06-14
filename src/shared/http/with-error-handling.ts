/**
 * Astro API route wrapper that converts handler results into standardized JSON responses.
 *
 * @module shared/http/with-error-handling
 * @remarks
 * **Request flow**
 * 1. Astro invokes the wrapped handler with {@link APIContext}.
 * 2. Handler runs inside `try/catch` and returns a {@link HandlerResult} (data, optional status/meta/headers).
 * 3. On success: {@link createSuccessResponse} → {@link jsonResponse} with `Content-Type: application/json`.
 * 4. Optional `result.headers` (e.g. auth cookies) are merged via {@link mergeResponseHeaders}.
 * 5. On throw: {@link createErrorResponse} maps the error (status + message + meta) → {@link jsonResponse}.
 * 6. The wrapper never re-throws — Astro always receives a `Response`.
 *
 * **Success envelope**
 * `{ data, status, meta }` — see {@link ApiEnvelope}.
 *
 * **Error envelope** (from {@link createErrorResponse})
 * `{ data: null, status, error, meta }` with HTTP status 400, 401, 403, 404, or 500 per {@link mapErrorToHttp}.
 *
 * Compose with {@link withZodValidation} by nesting: validation middleware should run first so invalid
 * input never reaches the business handler.
 *
 * @see {@link createSuccessResponse}
 * @see {@link createErrorResponse}
 * @see {@link withZodValidation}
 */

import type { APIContext } from 'astro'
import {
  createErrorResponse,
  createSuccessResponse,
} from '@shared/http/create-api-response-util'
import { jsonResponse, mergeResponseHeaders } from '@shared/http/api-response-serialize-util'

/**
 * Value returned by a route handler before envelope serialization.
 */
type HandlerResult = {
  /** Serializable payload placed in `envelope.data`. */
  data: unknown
  /** HTTP status; defaults to 200 when omitted. */
  status?: number
  /** Optional metadata merged into `envelope.meta`. */
  meta?: Record<string, unknown>
  /** Optional headers (e.g. `Set-Cookie`) appended to the JSON response. */
  headers?: Headers
}

/**
 * Astro API route handler function type accepted by {@link withErrorHandling}.
 */
type RouteHandler<TContext extends APIContext = APIContext> = (
  context: TContext
) => Promise<HandlerResult> | HandlerResult

/**
 * Wraps an Astro API handler with standardized success and error JSON envelopes.
 *
 * @param handler - Route logic returning {@link HandlerResult}; may throw {@link BaseError} subclasses
 * @returns Astro-compatible `APIRoute` that always resolves to a `Response` (never throws to the framework)
 *
 * @remarks
 * **Error responses**
 * All thrown values pass through {@link mapErrorToHttp}. Clients receive the envelope shape with
 * appropriate status (e.g. 404 for `ANIME_NOT_FOUND`, 500 for {@link InfraError} with generic message).
 *
 * @example
 * ```typescript
 * export const GET = withErrorHandling(async () => {
 *   const anime = await animeService.getById(1)
 *   return { data: anime, status: 200 }
 * })
 * ```
 *
 * @see {@link HandlerResult}
 */
export function withErrorHandling<TContext extends APIContext>(
  handler: RouteHandler<TContext>
): (context: TContext) => Promise<Response> {
  return async (context: TContext) => {
    try {
      const result = await handler(context)
      const payload = createSuccessResponse(
        result.data,
        result.status ?? 200,
        result.meta ?? {}
      )
      const response = jsonResponse(payload, undefined, payload.status)

      if (result.headers) {
        mergeResponseHeaders(response.headers, result.headers)
      }

      return response
    } catch (error) {
      const payload = createErrorResponse(error)
      return jsonResponse(payload, undefined, payload.status)
    }
  }
}
