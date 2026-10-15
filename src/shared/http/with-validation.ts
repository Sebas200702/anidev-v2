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
 * 5. On success: the same `context` object with a `validated` property holding parsed data is
 *    passed to the handler. `validated` is attached without re-copying the context, so Astro's
 *    accessor properties (`session`, `csp`, …) are never evaluated during the hand-off.
 *
 * **Validated input shape** (what the Zod schema receives)
 * ```typescript
 * {
 *   params: APIContext['params'],  // Astro dynamic route segments, e.g. { id: '42' }
 *   query: Record<string, string>, // URL search params as plain key/value strings
 *   body: unknown,                 // JSON body for non-GET; null for GET or parse failures
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
import { createErrorResponse } from '@shared/http/create-api-response-util'
import { jsonResponse } from '@shared/http/api-response-serialize-util'
import type { APIContext } from 'astro'
import type { ZodType } from 'zod'
import type {
  ValidatedHandler,
  ValidationRequestData,
} from './with-validation-types'

const MAX_REQUEST_BODY_BYTES = 1024 * 1024

const readBoundedBody = async (request: Request): Promise<unknown> => {
  if (!request.body) return null

  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0

  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    if (value) {
      total += value.byteLength
      if (total > MAX_REQUEST_BODY_BYTES) {
        await reader.cancel()
        throw new Error('REQUEST_TOO_LARGE')
      }
      chunks.push(value)
    }
  }

  if (total === 0) return null

  const bytes = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }

  const text = new TextDecoder().decode(bytes)
  if (!text.trim()) return null
  try {
    return JSON.parse(text) as unknown
  } catch {
    return null
  }
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
export const withZodValidation = <T>(schema: ZodType<T>) => {
  return (handler: ValidatedHandler<T>) => {
    return async (context: APIContext) => {
      const url = new URL(context.request.url)

      const method = context.request.method.toUpperCase()
      const isReadMethod = method === 'GET' || method === 'HEAD'

      // Bound the request body BEFORE parsing JSON, including chunked
      // payloads without a Content-Length header.
      if (!isReadMethod) {
        const contentLengthHeader =
          context.request.headers.get('content-length')
        if (contentLengthHeader !== null) {
          const declaredSize = Number(contentLengthHeader)
          if (
            Number.isFinite(declaredSize) &&
            declaredSize > MAX_REQUEST_BODY_BYTES
          ) {
            return new Response(
              JSON.stringify({
                data: null,
                status: 413,
                error: 'Request too large',
                code: ErrorCodes.REQUEST_TOO_LARGE,
                meta: {},
              }),
              {
                status: 413,
                headers: { 'Content-Type': 'application/json' },
              }
            )
          }
        }
      }

      let body: unknown = null
      if (!isReadMethod) {
        try {
          body = await readBoundedBody(context.request)
        } catch {
          return new Response(
            JSON.stringify({
              data: null,
              status: 413,
              error: 'Request too large',
              code: ErrorCodes.REQUEST_TOO_LARGE,
              meta: {},
            }),
            {
              status: 413,
              headers: { 'Content-Type': 'application/json' },
            }
          )
        }
      }

      const data: ValidationRequestData = {
        params: context.params,
        query: Object.fromEntries(url.searchParams.entries()),
        body,
      }

      const result = schema.safeParse(data)

      if (!result.success) {
        const error = new ValidationError(
          ErrorCodes.VALIDATION_ERROR,
          'Invalid request',
          { issues: result.error.issues }
        )

        const { payload, headers } = createErrorResponse(error)
        return jsonResponse(payload, headers, payload.status)
      }

      // Attach `validated` without copying the context. Spreading the context
      // would invoke every own accessor property — including Astro's `session`
      // and `csp` getters — triggering configuration warnings on each request.
      Object.defineProperty(context, 'validated', {
        value: result.data,
        enumerable: true,
        configurable: true,
        writable: true,
      })

      return handler(context as APIContext & { validated: T })
    }
  }
}
