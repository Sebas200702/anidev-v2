/**
 * Zod schemas for full anime detail API payloads.
 *
 * @module domains/anime/schemas/anime-full-schema
 */
import { createApiResponseSchema } from '@shared/schemas/api-schema'
import { z } from 'zod'

/**
 * Validates a media asset attached to an anime entry.
 *
 * @remarks
 * - `mediaType` — e.g. trailer, poster
 * - `src` — optional URL string
 * - `size` — required string (defaults applied in mapper)
 */
export const animeMediaSchema = z.object({
  mediaType: z.string(),
  src: z.string().optional(),
  size: z.string(),
})

/**
 * Validates a related anime reference within a relation group.
 */
export const animeRelationsSchema = z.object({
  relatedId: z.number(),
  title: z.string(),
  url: z.url(),
})

/**
 * Validates an alternate title variant for an anime.
 */
export const animeTitleSchema = z.object({
  title: z.string(),
  type: z.enum(['main', 'english', 'japanese', 'synonym']),
})

/**
 * Validates a genre, theme, or demographic taxonomy entry (with MAL id).
 */
export const animeGenreSchema = z.object({
  name: z.string(),
  malId: z.number(),
})

/**
 * Validates an opening or ending theme entry.
 */
export const animeMusicSchema = z.object({
  order: z.number(),
  title: z.string(),
  type: z.enum(['opening', 'ending']),
  url: z.url(),
})

/**
 * Validates an external platform identifier for an anime.
 */
export const animeExternalIdsSchema = z.object({
  id: z.union([z.number(), z.string()]),
  source: z.string(),
})

/**
 * **Response schema** — expanded anime detail from {@link mapAnimeToFullDetails}.
 */
export const animeFullDetailsSchema = z.object({
  malId: z.number(),
  title: z.string(),
  titles: z.array(animeTitleSchema),
  year: z.number(),
  score: z.number(),
  scoredBy: z.number(),
  popularityRank: z.number(),
  rating: z.string(),
  season: z.string(),
  background: z.string(),
  status: z.string(),
  genres: z.array(animeGenreSchema),
  themes: z.array(animeGenreSchema),
  demographics: z.array(animeGenreSchema),
  synopsis: z.string(),
  media: z.array(animeMediaSchema),
  relations: z.array(
    z.object({
      relation: z.string(),
      entry: z.array(animeRelationsSchema),
    })
  ),
  type: z.string(),
  episodes: z.number(),
  music: z.object({
    openings: z.array(animeMusicSchema),
    endings: z.array(animeMusicSchema),
  }),
  externalIds: z.array(animeExternalIdsSchema),
})

/**
 * **Response envelope** for full detail endpoint.
 */
export const animeFullDetailsResponseSchema = createApiResponseSchema(
  animeFullDetailsSchema
)

/**
 * **Request schema** for `GET /api/anime/:malId/full`.
 */
export const getAnimeFullSchema = z.object({
  params: z.object({
    malId: z.coerce.number().int().positive(),
  }),
  query: z.object({}).optional().default({}),
  body: z.unknown().optional(),
})
