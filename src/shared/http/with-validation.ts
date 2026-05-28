/**
 * Astro API middleware that validates route input with Zod before invoking a handler.
 *
 * @module shared/http/with-validation
 * @remarks
 * **Request flow**
 * 1. Incoming {@link APIContext} is received by the returned middleware function.
 * 2. Request data is assembled into a {@link ValidationRequestData} object (see below).
 * 3. The provided Zod schema parses the full object via `safeParse`.
 * 4. On failure: a {@link ValidationError} is created, mapped with {@link mapErrorToHttp}, and returned
 *    as JSON with status **400** — same envelope shape as {@link withErrorHandling} errors
 *    (`{ data: null, status, error, meta }`).
 * 5. On success: the handler runs with `context` spread plus a `validated` property holding parsed data.
 *
 * **Validated input shape** (what the Zod schema receives)
 * ```typescript
 * {
 *   params: APIContext['params'],  // Astro dynamic route segments, e.g. { id: '42' }
 *   query: Record<string, string>, // URL search params as plain key/value strings
 *   body: unknown | null           // JSON body for non-GET; null for GET or parse failures
 * }
 * ```
 *
 * Handlers should define a schema that matches this top-level shape, for example:
 * `z.object({ params: z.object({ id: z.coerce.number() }), query: z.object({}), body: z.null() })`.
 *
 * **Error response (validation failure)**
 * - Status: **400** (from {@link mapErrorToHttp} for {@link ValidationError})
 * - Body envelope: `{ data: null, status: 400, error: 'Invalid request', meta: { details: { issues: ZodIssue[] } } }`
 * - `Content-Type`: `application/json`
 *
 * @see {@link withErrorHandling} — wraps handlers that return success/error envelopes after validation
 * @see {@link mapErrorToHttp} — status and body mapping for {@link ValidationError}
 * @see {@link createApiResponseSchema} — Zod schema for the response envelope
 */

import { ErrorCodes } from '@shared/errors/codes'
import { ValidationError } from '@shared/errors/app-error'
import { mapErrorToHttp } from '@shared/errors/map-error-to-http'
import type { APIContext } from 'astro'
import type { ZodType } from 'zod'

/**
 * Handler invoked after successful validation.
 *
 * @typeParam T - Inferred output type of the validation schema
 */
type ValidatedHandler<T> = (
  context: APIContext & { validated: T }
) => Response | Promise<Response>

/**
 * Raw request slices passed to the Zod schema before parsing.
 *
 * @remarks
 * This is the exact object shape validated by {@link withZodValidation}. Schemas should expect
 * these three keys at the top level.
 */
type ValidationRequestData = {
  /** Astro route dynamic parameters (e.g. `[id]` → `{ id: string }`). */
  params: APIContext['params']
  /** Query string parameters from `URL.searchParams`, coerced to string values. */
  query: Record<string, string>
  /**
   * Parsed JSON request body for non-`GET` methods.
   * - `GET` requests always receive `null` (body is not read).
   * - Invalid or empty JSON body yields `null` (not a validation error until the schema rejects it).
   */
  body: unknown | null
}

/**
 * Returns middleware that validates `params`, `query`, and `body`, then calls the handler with `validated` data.
 *
 * @typeParam T - Parsed type produced by `schema`
 * @param schema - Zod schema whose input matches {@link ValidationRequestData}
 * @returns A function that accepts a {@link ValidatedHandler} and returns an Astro-compatible middleware
 *
 * @remarks
 * **Body parsing edge cases**
 * - `GET` / `HEAD`: `body` is `null` without reading the request stream.
 * - Non-GET with invalid JSON: `body` becomes `null`; whether that fails validation depends on the schema.
 *
 * @example
 * ```typescript
 * import { z } from 'zod'
 * import { withZodValidation } from '@shared/http/with-validation'
 *
 * const schema = z.object({
 *   params: z.object({ animeId: z.coerce.number().int().positive() }),
 *   query: z.object({ tab: z.enum(['info', 'chars']).optional() }),
 *   body: z.null(),
 * })
 *
 * export const GET = withZodValidation(schema)(async ({ validated }) => {
 *   const { animeId } = validated.params
 *   // ...
 *   return new Response(JSON.stringify({ ok: true }))
 * })
 * ```
 *
 * @see {@link ValidationRequestData}
 * @see {@link ValidatedHandler}
 */
export function withZodValidation<T>(schema: ZodType<T>) {
  return (handler: ValidatedHandler<T>) => {
    return async (context: APIContext) => {
      const url = new URL(context.request.url)

      const data: ValidationRequestData = {
        params: context.params,
        query: Object.fromEntries(url.searchParams.entries()),
        body:
          context.request.method === 'GET'
            ? null
            : await context.request.json().catch(() => null),
      }

      const result = schema.safeParse(data)

      if (!result.success) {
        const error = new ValidationError(
          ErrorCodes.VALIDATION_ERROR,
          'Invalid request',
          { issues: result.error.issues }
        )

        const { status, body } = mapErrorToHttp(error)
        const payload = {
          data: null,
          status,
          error: body.message ?? 'Unexpected error',
          meta: body.meta ?? {},
        }

        return new Response(JSON.stringify(payload), {
          status,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      return handler({
        ...context,
        validated: result.data,
      })
    }
  }
}
