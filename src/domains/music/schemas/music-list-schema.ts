/**
 * Zod schemas for music list and filter API payloads.
 *
 * @module domains/music/schemas/music-list-schema
 */
import { createApiResponseSchema } from '@shared/schemas/api-schema'
import { musicCardSchema } from '@domains/music/schemas/music-card-schema'
import { z } from 'zod'

/**
 * **Request query schema** — raw query parameters for music list requests.
 *
 * @remarks
 * | Field | Validation |
 * |-------|------------|
 * | `page` | `z.coerce.number().int().min(1).default(1)` |
 * | `limit` | `z.coerce.number().int().min(1).max(100).default(10)` |
 * | `type` | optional string — `OP`, `ED`, `UNK`, or labels `opening` / `ending` (normalized in mapper) |
 * | `query` | optional search string (title substring) |
 */
export const musicListFiltersParamsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  type: z.string().optional(),
  query: z.string().optional(),
})

/**
 * **Normalized filters** — after {@link mapMusicListFilters}; used by repos and cache keys.
 */
export const musicListFiltersSchema = musicListFiltersParamsSchema.extend({
  type: z.enum(['OP', 'ED', 'UNK']).optional(),
})

/**
 * **Full request schema** for `GET /api/music` (list).
 */
export const musicListRequestSchema = z.object({
  params: z.object({}).optional().default({}),
  query: musicListFiltersParamsSchema,
  body: z.unknown().optional(),
})

/**
 * **Response schema** — paginated cards (total count returned separately by route).
 */
export const musicListResponseSchema = createApiResponseSchema(
  z.array(musicCardSchema)
)
