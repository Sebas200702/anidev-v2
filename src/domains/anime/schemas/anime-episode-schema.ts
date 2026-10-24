/**
 * Zod schemas for the anime episode catalog API.
 *
 * @module domains/anime/schemas/anime-episode-schema
 * @remarks
 * List items omit `synopsis` to keep pages small; the detail payload carries it.
 * `duration` and `aired` are the source text, unparsed.
 *
 * @see {@link animeEpisodesService}
 */
import { z } from 'zod'
import {
  EPISODE_MAX_PAGE,
  EPISODE_PAGE_DEFAULT_LIMIT,
  EPISODE_PAGE_MAX_LIMIT,
} from '@anime/constants'
import { createApiResponseSchema } from '@shared/schemas/api-schema'

const malIdSchema = z.coerce.number().int().positive()

/**
 * Validates one episode in a list page.
 *
 * @remarks
 * `id` is the `episode.id` surrogate key used by watch progress. `imageUrl` is
 * the `/media/episode/{id}/thumbnail` route, which serves the placeholder until
 * the pipeline stores a thumbnail.
 */
export const animeEpisodeItemSchema = z.object({
  id: z.number().int(),
  number: z.number().int(),
  title: z.string(),
  duration: z.string().nullable(),
  aired: z.string().nullable(),
  imageUrl: z.url(),
  altImageText: z.string(),
})

/**
 * Validates a single episode with its synopsis.
 */
export const animeEpisodeDetailSchema = animeEpisodeItemSchema.extend({
  synopsis: z.string().nullable(),
})

/**
 * **Request schema** for `GET /api/anime/:malId/episodes`.
 *
 * @remarks `page` 1–{@link EPISODE_MAX_PAGE}, `limit` 1–{@link EPISODE_PAGE_MAX_LIMIT}.
 */
export const getAnimeEpisodesSchema = z.object({
  params: z.object({ malId: malIdSchema }),
  query: z
    .object({
      page: z.coerce.number().int().min(1).max(EPISODE_MAX_PAGE).default(1),
      limit: z.coerce
        .number()
        .int()
        .min(1)
        .max(EPISODE_PAGE_MAX_LIMIT)
        .default(EPISODE_PAGE_DEFAULT_LIMIT),
    })
    .optional()
    .default({ page: 1, limit: EPISODE_PAGE_DEFAULT_LIMIT }),
  body: z.unknown().optional(),
})

/**
 * **Request schema** for `GET /api/anime/:malId/episodes/:number`.
 */
export const getAnimeEpisodeSchema = z.object({
  params: z.object({
    malId: malIdSchema,
    // Source data holds sentinel numbers (e.g. -1); every stored row stays addressable.
    number: z.coerce.number().int(),
  }),
  query: z.object({}).optional().default({}),
  body: z.unknown().optional(),
})

/**
 * **Response schema** — episode page in the API envelope.
 */
export const animeEpisodesResponseSchema = createApiResponseSchema(
  z.array(animeEpisodeItemSchema)
)

/**
 * **Response schema** — single episode in the API envelope.
 */
export const animeEpisodeResponseSchema = createApiResponseSchema(
  animeEpisodeDetailSchema
)
