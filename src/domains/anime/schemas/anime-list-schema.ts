/**
 * Zod schemas for anime list and filter API payloads.
 *
 * @module domains/anime/schemas/anime-list-schema
 */
import { createApiResponseSchema } from '@shared/schemas/api-schema'
import { animeCardSchema } from '@domains/anime/schemas/anime-card-schema'
import { z } from 'zod'

/**
 * **Request query schema** — raw query parameters for anime list requests.
 *
 * @remarks
 * | Field | Validation |
 * |-------|------------|
 * | `page` | `z.coerce.number().int().min(1).default(1)` |
 * | `limit` | `z.coerce.number().int().min(1).max(100).default(10)` |
 * | `genre` | optional string (comma-separated at route; normalized to array in mapper) |
 * | `status` | optional string |
 * | `rating` | optional string |
 * | `year` | `z.coerce.number().int().min(1900).max(current year).optional()` |
 * | `type` | optional string |
 * | `query` | optional search string |
 */
export const animeFiltersParamsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  genre: z.string().optional(),
  status: z.string().optional(),
  rating: z.string().optional(),
  year: z.coerce
    .number()
    .int()
    .min(1900)
    .max(new Date().getFullYear())
    .optional(),
  type: z.string().optional(),
  query: z.string().optional(),
})

/**
 * **Normalized filters** — after {@link mapAnimeFilters}; used by repos and cache keys.
 *
 * @remarks
 * Extends params schema with `genre` / `status` / `rating` / `type` as `string[]`.
 */
export const animeFiltersSchema = animeFiltersParamsSchema.extend({
  genre: z.array(z.string()).optional(),
  status: z.array(z.string()).optional(),
  rating: z.array(z.string()).optional(),
  type: z.array(z.string()).optional(),
})

/**
 * **Full request schema** for `GET /api/anime` (list).
 */
export const animeListRequestSchema = z.object({
  params: z.object({}).optional().default({}),
  query: animeFiltersParamsSchema,
  body: z.unknown().optional(),
})

/**
 * **Response schema** — paginated cards (total count returned separately by route).
 */
export const animeListResponseSchema = createApiResponseSchema(
  z.array(animeCardSchema)
)
