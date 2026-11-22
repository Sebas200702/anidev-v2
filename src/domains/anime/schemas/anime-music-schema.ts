/**
 * Zod schemas for the anime music API.
 *
 * @module domains/anime/schemas/anime-music-schema
 * @remarks
 * Items reuse the `/full` theme shape ({@link animeMusicSchema}) plus the music
 * `id`, so the list and the detail endpoint address the same track.
 *
 * @see {@link animeMusicService}
 */
import { z } from 'zod'
import {
  ANIME_MUSIC_MAX_PAGE,
  ANIME_MUSIC_PAGE_DEFAULT_LIMIT,
  ANIME_MUSIC_PAGE_MAX_LIMIT,
  ANIME_MUSIC_TYPES,
} from '@anime/constants'
import { createApiResponseSchema } from '@shared/schemas/api-schema'
import { animeMusicSchema } from './anime-full-schema'

const malIdSchema = z.coerce.number().int().positive()

/**
 * Validates one opening or ending of an anime.
 *
 * @remarks
 * - `id` — `music.id`, addressable at `/api/anime/:malId/music/:id`
 * - `order` — theme number (`anime_music.sequence`), index fallback per type
 * - `type` — `opening` | `ending`
 * - `url` — absolute site URL of the track page
 */
export const animeMusicItemSchema = animeMusicSchema.extend({
  id: z.number().int(),
})

/**
 * **Request schema** for `GET /api/anime/:malId/music`.
 *
 * @remarks `type` is lowercased before the enum check; `page`
 * 1–{@link ANIME_MUSIC_MAX_PAGE}, `limit` 1–{@link ANIME_MUSIC_PAGE_MAX_LIMIT}.
 */
export const getAnimeMusicListSchema = z.object({
  params: z.object({ malId: malIdSchema }),
  query: z
    .object({
      type: z
        .string()
        .trim()
        .toLowerCase()
        .pipe(z.enum(ANIME_MUSIC_TYPES))
        .optional(),
      page: z.coerce.number().int().min(1).max(ANIME_MUSIC_MAX_PAGE).default(1),
      limit: z.coerce
        .number()
        .int()
        .min(1)
        .max(ANIME_MUSIC_PAGE_MAX_LIMIT)
        .default(ANIME_MUSIC_PAGE_DEFAULT_LIMIT),
    })
    .optional()
    .default({ page: 1, limit: ANIME_MUSIC_PAGE_DEFAULT_LIMIT }),
  body: z.unknown().optional(),
})

/**
 * **Request schema** for `GET /api/anime/:malId/music/:musicId`.
 */
export const getAnimeMusicItemSchema = z.object({
  params: z.object({
    malId: malIdSchema,
    musicId: z.coerce.number().int().positive(),
  }),
  query: z.object({}).optional().default({}),
  body: z.unknown().optional(),
})

/**
 * **Response schema** — music page in the API envelope.
 */
export const animeMusicListResponseSchema = createApiResponseSchema(
  z.array(animeMusicItemSchema)
)

/**
 * **Response schema** — single music item in the API envelope.
 */
export const animeMusicItemResponseSchema =
  createApiResponseSchema(animeMusicItemSchema)
