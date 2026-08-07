/**
 * Types for the Zod validation middleware wrapper.
 *
 * @module shared/http/with-validation-types
 * @remarks
 * Consumed by {@link module:shared/http/with-validation} to shape the raw request
 * slices passed to a Zod schema and the handler invoked after successful parsing.
 *
 * @see {@link withZodValidation} for the middleware factory
 */

import type { APIContext } from 'astro'

/**
 * Handler invoked after successful validation.
 *
 * @typeParam T - Inferred output type of the validation schema
 */
export type ValidatedHandler<T> = (
  context: APIContext & { validated: T }
) => Response | Promise<Response>

/**
 * Raw request slices passed to the Zod schema before parsing.
 *
 * @remarks
 * This is the exact object shape validated by {@link withZodValidation}. Schemas should expect
 * these three keys at the top level.
 */
export interface ValidationRequestData {
  /** Astro route dynamic parameters (e.g. `[id]` → `{ id: string }`). */
  params: APIContext['params']
  /** Query string parameters from `URL.searchParams`, coerced to string values. */
  query: Record<string, string>
  /**
   * Parsed JSON request body for non-`GET` methods.
   * - `GET` requests always receive `null` (body is not read).
   * - Invalid or empty JSON body yields `null` (not a validation error until the schema rejects it).
   */
  body: unknown
}
