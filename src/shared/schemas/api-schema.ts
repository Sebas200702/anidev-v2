/**
 * Zod schemas and inferred types for the standard JSON API response envelope.
 *
 * @module shared/schemas/api-schema
 * @remarks
 * All API routes that use {@link createSuccessResponse}, {@link createErrorResponse}, or
 * {@link withErrorHandling} should serialize responses matching this envelope so clients and
 * contract tests share one shape.
 *
 * **Envelope structure**
 * ```typescript
 * {
 *   data: T | null,           // Payload on success; null on error
 *   status: number,           // HTTP status code mirrored in the JSON body
 *   error?: string,           // Present on failure — human-readable message
 *   meta?: Record<string, unknown>  // Optional metadata (pagination, error details, etc.)
 * }
 * ```
 *
 * - **Success**: `data` holds the response DTO, `status` is typically 200 (or 201, etc.),
 *   `error` is omitted, `meta` may include pagination or cache hints.
 * - **Error**: `data` is `null`, `status` reflects the mapped HTTP code (400, 401, 404, 500, …),
 *   `error` carries the client-safe message, `meta` often includes `details` from {@link mapErrorToHttp}.
 *
 * @see {@link ApiEnvelope} — runtime TypeScript type in {@link create-api-response-util}
 * @see {@link createApiResponseSchema} — builds a Zod validator for a typed `data` field
 * @see {@link createSuccessResponse} / {@link createErrorResponse}
 */

import { z } from 'zod'

/**
 * Minimal Zod schema type constraint used by {@link ApiResponse}.
 *
 * @remarks
 * Aligns with Zod 4 internals so inferred response types stay compatible with domain data schemas.
 */
type InferableZodSchema = z.ZodType<
  unknown,
  unknown,
  z.core.$ZodTypeInternals<unknown, unknown>
>

/**
 * Factory for a Zod object schema that validates the standard API envelope around a `data` schema.
 *
 * @typeParam T - Zod schema describing the successful `data` payload (nullable in the envelope)
 * @param dataSchema - Validator applied to `data` when present
 * @returns Zod object schema validating `{ data, status, error?, meta? }`
 *
 * @remarks
 * Field rules:
 * - `data` — `dataSchema.nullable()`; must be `null` on error responses.
 * - `status` — integer HTTP status code.
 * - `error` — optional string; expected on error responses.
 * - `meta` — optional record for arbitrary metadata (error `details`, page info, etc.).
 *
 * @example
 * ```typescript
 * import { z } from 'zod'
 * import { createApiResponseSchema } from '@shared/schemas/api-schema'
 *
 * const AnimeSchema = z.object({ id: z.number(), title: z.string() })
 * const AnimeListResponseSchema = createApiResponseSchema(z.array(AnimeSchema))
 *
 * // Validates: { data: [{ id: 1, title: '...' }], status: 200, meta?: {...} }
 * ```
 *
 * @see {@link ApiResponse}
 */
export const createApiResponseSchema = <T extends z.ZodTypeAny>(
  dataSchema: T
) =>
  z.object({
    /** Response payload; `null` when the request failed. */
    data: dataSchema.nullable(),
    /** HTTP status code duplicated in the JSON body for client-side routing. */
    status: z.number().int(),
    /** Human-readable error message; omitted on successful responses. */
    error: z.string().optional(),
    /** Optional metadata (pagination, validation issues, etc.). */
    meta: z.record(z.any(), z.any()).optional(),
  })

/**
 * Inferred TypeScript type for an API envelope wrapping a given data schema.
 *
 * @typeParam T - Zod schema used for the `data` field
 *
 * @remarks
 * Equivalent to `z.infer<ReturnType<typeof createApiResponseSchema<T>>>`.
 *
 * @see {@link createApiResponseSchema}
 */
export type ApiResponse<T extends InferableZodSchema> = z.infer<
  ReturnType<typeof createApiResponseSchema<T>>
>
