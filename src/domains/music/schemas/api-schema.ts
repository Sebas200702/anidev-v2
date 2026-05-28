/**
 * @module @domains/music/schemas/api-schema
 * @remarks Zod schemas for music API route validation and standardized response envelopes.
 */
import { z } from 'zod'
import { createApiResponseSchema } from '@shared/schemas/api-schema'
import { musicDetailsSchema } from '@domains/music/schemas/music-details-schema'

/**
 * Validates route parameters for music detail requests.
 *
 * @remarks Expects a string `id` param that route handlers coerce to a number before
 * calling {@link musicService.getMusicDetailsById}.
 * @see {@link musicInvalidId} for invalid identifier handling
 * @see {@link musicDetailsResponseSchema} for the success response wrapper
 * @example
 * ```typescript
 * const parsed = getMusicSchema.parse({ params: { id: '42' } })
 * const musicId = Number(parsed.params.id)
 * ```
 */
export const getMusicSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
})

/**
 * Validates the API response wrapping a music detail object.
 *
 * @remarks Uses {@link createApiResponseSchema} to produce the standard `{ data, meta }`
 * envelope around a {@link MusicDetails} payload.
 * @see {@link musicDetailsSchema} for the inner payload schema
 * @example
 * ```typescript
 * const response = musicDetailsResponseSchema.parse({ data: details, meta: {} })
 * ```
 */
export const musicDetailsResponseSchema =
  createApiResponseSchema(musicDetailsSchema)
