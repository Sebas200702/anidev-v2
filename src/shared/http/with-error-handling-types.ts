/**
 * Types for the standardized API route error-handling wrapper.
 *
 * @module shared/http/with-error-handling-types
 * @remarks
 * Consumed by {@link module:shared/http/with-error-handling} to describe the value a
 * route handler returns before envelope serialization and the handler function shape.
 *
 * @see {@link withErrorHandling} for the wrapper factory
 */

import type { APIContext } from 'astro'

/**
 * Value returned by a route handler before envelope serialization.
 */
export interface HandlerResult {
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
export type RouteHandler<TContext extends APIContext = APIContext> = (
  context: TContext
) => Promise<HandlerResult> | HandlerResult
