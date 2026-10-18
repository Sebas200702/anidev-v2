/**
 * Anime episode detail API endpoint.
 *
 * @module pages/api/anime/[malId]/episodes/[number]
 *
 * **Route:** `GET /api/anime/:malId/episodes/:number`
 *
 * **Authentication:** Public — nested under the `/api/anime` public prefix.
 *
 * Returns one episode, including its synopsis.
 *
 * @see {@link getAnimeEpisodeSchema} — request validation schema
 * @see {@link animeEpisodeResponseSchema} — response validation schema
 * @see {@link animeEpisodesService.getEpisode} — detail query service
 */
import type { APIContext, APIRoute } from 'astro'
import {
  animeEpisodeResponseSchema,
  getAnimeEpisodeSchema,
} from '@anime/schemas/anime-episode-schema'
import { animeEpisodesService } from '@anime/services/anime-episodes'
import { withErrorHandling } from '@http/with-error-handling'
import { withZodValidation } from '@http/with-validation'

type EpisodeContext = APIContext & {
  validated: { params: { malId: number; number: number } }
}

/**
 * Returns one episode of a MyAnimeList anime by episode number.
 *
 * @remarks
 * **Success — `200 OK`:** `data: AnimeEpisodeDetail`, `meta: { stale }`.
 *
 * **Errors**
 *
 * | Status | Code | When |
 * |--------|------|------|
 * | 400 | `VALIDATION_ERROR` | `malId` or `number` not an integer |
 * | 404 | `ANIME_NOT_FOUND` | No anime exists for `malId` |
 * | 404 | `EPISODE_NOT_FOUND` | The anime has no episode with that number |
 * | 503 | `DB_ERROR` | Database down and no stale copy |
 *
 * @example
 * ```bash
 * curl "http://localhost:4321/api/anime/1/episodes/1"
 * ```
 */
export const GET: APIRoute = withZodValidation(getAnimeEpisodeSchema)(
  withErrorHandling(
    async ({ validated }: EpisodeContext) => {
      const { malId, number } = validated.params
      const { value: episode, isStale } = await animeEpisodesService.getEpisode(
        malId,
        number
      )

      return { data: episode, status: 200, meta: { stale: isStale } }
    },
    { responseSchema: animeEpisodeResponseSchema }
  )
)
