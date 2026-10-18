/**
 * Anime episode list API endpoint.
 *
 * @module pages/api/anime/[malId]/episodes/index
 *
 * **Route:** `GET /api/anime/:malId/episodes`
 *
 * **Authentication:** Public — nested under the `/api/anime` public prefix.
 *
 * Returns one page of an anime's episodes ordered by number. Items omit the
 * synopsis; fetch `/episodes/:number` for it.
 *
 * @see {@link getAnimeEpisodesSchema} — request validation schema
 * @see {@link animeEpisodesResponseSchema} — response validation schema
 * @see {@link animeEpisodesService.getEpisodes} — page query service
 */
import type { APIContext, APIRoute } from 'astro'
import {
  animeEpisodesResponseSchema,
  getAnimeEpisodesSchema,
} from '@anime/schemas/anime-episode-schema'
import { animeEpisodesService } from '@anime/services/anime-episodes'
import { withErrorHandling } from '@http/with-error-handling'
import { withZodValidation } from '@http/with-validation'

type EpisodesContext = APIContext & {
  validated: {
    params: { malId: number }
    query: { page: number; limit: number }
  }
}

/**
 * Returns a page of episodes for a MyAnimeList anime ID.
 *
 * @remarks
 * **Request**
 *
 * | Source | Field | Type | Required | Description |
 * |--------|-------|------|----------|-------------|
 * | Params | `malId` | `number` | Yes | MyAnimeList anime identifier |
 * | Query | `page` | `number` | No | 1–10 000, default `1` |
 * | Query | `limit` | `number` | No | 1–100, default `24` |
 *
 * **Success — `200 OK`:** `data: AnimeEpisodeItem[]`,
 * `meta: { stale, page, limit, total, hasNext }`. A page past the end of an
 * existing anime is an empty list.
 *
 * **Errors**
 *
 * | Status | Code | When |
 * |--------|------|------|
 * | 400 | `VALIDATION_ERROR` | `malId`, `page` or `limit` invalid |
 * | 404 | `ANIME_NOT_FOUND` | No anime exists for `malId` |
 * | 503 | `DB_ERROR` | Database down and no stale copy |
 *
 * @example
 * ```bash
 * curl "http://localhost:4321/api/anime/1/episodes?page=1&limit=24"
 * ```
 */
export const GET: APIRoute = withZodValidation(getAnimeEpisodesSchema)(
  withErrorHandling(
    async ({ validated }: EpisodesContext) => {
      const { malId } = validated.params
      const { page, limit } = validated.query
      const {
        value: { list, total },
        isStale,
      } = await animeEpisodesService.getEpisodes({ malId, page, limit })

      return {
        data: list,
        status: 200,
        meta: {
          stale: isStale,
          page,
          limit,
          total,
          hasNext: page * limit < total,
        },
      }
    },
    { responseSchema: animeEpisodesResponseSchema }
  )
)
