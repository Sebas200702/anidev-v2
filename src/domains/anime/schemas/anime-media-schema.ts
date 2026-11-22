/**
 * Zod schemas for the anime media API.
 *
 * @module domains/anime/schemas/anime-media-schema
 * @remarks
 * Items expose the on-site `/media` proxy URL, never the upstream `src`, so the
 * client always gets optimized, cached bytes from the same origin.
 *
 * @see {@link animeMediaService}
 */
import { z } from 'zod'
import {
  ANIME_MEDIA_MAX_PAGE,
  ANIME_MEDIA_PAGE_DEFAULT_LIMIT,
  ANIME_MEDIA_PAGE_MAX_LIMIT,
  ANIME_MEDIA_TYPE_MAX_LENGTH,
} from '@anime/constants'
import { createApiResponseSchema } from '@shared/schemas/api-schema'

const malIdSchema = z.coerce.number().int().positive()

/**
 * Validates one media asset of an anime.
 *
 * @remarks
 * - `id` — `anime_media.id`, addressable at `/api/anime/:malId/media/:id`
 * - `size` — normalized to `small` | `large` | `default`
 * - `source` — upstream detected from the asset host (e.g. `anilist`)
 * - `url` — origin-relative `/media/anime/{malId}/{type}/{size}/{index}` URL
 */
export const animeMediaItemSchema = z.object({
  id: z.number().int(),
  mediaType: z.string(),
  size: z.enum(['small', 'large', 'default']),
  source: z.string(),
  url: z.string(),
})

/**
 * **Request schema** for `GET /api/anime/:malId/media`.
 *
 * @remarks `type` is lowercased; `page` 1–{@link ANIME_MEDIA_MAX_PAGE},
 * `limit` 1–{@link ANIME_MEDIA_PAGE_MAX_LIMIT}.
 */
export const getAnimeMediaListSchema = z.object({
  params: z.object({ malId: malIdSchema }),
  query: z
    .object({
      type: z
        .string()
        .trim()
        .toLowerCase()
        .min(1)
        .max(ANIME_MEDIA_TYPE_MAX_LENGTH)
        .optional(),
      page: z.coerce.number().int().min(1).max(ANIME_MEDIA_MAX_PAGE).default(1),
      limit: z.coerce
        .number()
        .int()
        .min(1)
        .max(ANIME_MEDIA_PAGE_MAX_LIMIT)
        .default(ANIME_MEDIA_PAGE_DEFAULT_LIMIT),
    })
    .optional()
    .default({ page: 1, limit: ANIME_MEDIA_PAGE_DEFAULT_LIMIT }),
  body: z.unknown().optional(),
})

/**
 * **Request schema** for `GET /api/anime/:malId/media/:mediaId`.
 */
export const getAnimeMediaItemSchema = z.object({
  params: z.object({
    malId: malIdSchema,
    mediaId: z.coerce.number().int().positive(),
  }),
  query: z.object({}).optional().default({}),
  body: z.unknown().optional(),
})

/**
 * **Response schema** — media page in the API envelope.
 */
export const animeMediaListResponseSchema = createApiResponseSchema(
  z.array(animeMediaItemSchema)
)

/**
 * **Response schema** — single media asset in the API envelope.
 */
export const animeMediaItemResponseSchema =
  createApiResponseSchema(animeMediaItemSchema)
