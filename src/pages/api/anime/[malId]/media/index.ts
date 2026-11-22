/**
 * Anime media list API endpoint.
 *
 * @module pages/api/anime/[malId]/media
 *
 * **Route:** `GET /api/anime/:malId/media`
 *
 * **Authentication:** Public — nested under the `/api/anime` public prefix.
 *
 * Returns the anime's media assets (posters, banners, …) as `/media` proxy
 * URLs, optionally filtered by type and paginated.
 *
 * @see {@link getAnimeMediaListSchema} — request validation schema
 * @see {@link animeMediaListResponseSchema} — response validation schema
 * @see {@link animeMediaService.getMediaPage} — page query service
 */
import type { APIContext, APIRoute } from 'astro'
import {
  animeMediaListResponseSchema,
  getAnimeMediaListSchema,
} from '@anime/schemas/anime-media-schema'
import { animeMediaService } from '@anime/services/anime-media'
import { withErrorHandling } from '@http/with-error-handling'
import { withZodValidation } from '@http/with-validation'

type MediaListContext = APIContext & {
  validated: {
    params: { malId: number }
    query: { type?: string; page: number; limit: number }
  }
}

/**
 * Returns a page of media assets for a MyAnimeList anime ID.
 *
 * @remarks
 * **Request**
 *
 * | Source | Field | Type | Required | Description |
 * |--------|-------|------|----------|-------------|
 * | Params | `malId` | `number` | Yes | MyAnimeList anime identifier |
 * | Query | `type` | `string` | No | Media type filter (e.g. `banner`), case-insensitive, 1–32 chars |
 * | Query | `page` | `number` | No | 1–1 000, default `1` |
 * | Query | `limit` | `number` | No | 1–100, default `24` |
 *
 * **Success — `200 OK`:** `data: AnimeMediaItem[]`,
 * `meta: { stale, page, limit, total, hasNext }`. An existing anime with no
 * matching media is an empty list.
 *
 * **Errors**
 *
 * | Status | Code | When |
 * |--------|------|------|
 * | 400 | `VALIDATION_ERROR` | `malId`, `type`, `page` or `limit` invalid |
 * | 404 | `ANIME_NOT_FOUND` | No anime exists for `malId` |
 * | 503 | `DB_ERROR` | Database down and no stale copy |
 *
 * @example
 * ```bash
 * curl "http://localhost:4321/api/anime/1/media?type=banner&page=1&limit=24"
 * ```
 */
export const GET: APIRoute = withZodValidation(getAnimeMediaListSchema)(
  withErrorHandling(
    async ({ validated }: MediaListContext) => {
      const { malId } = validated.params
      const { type, page, limit } = validated.query
      const {
        value: { list, total },
        isStale,
      } = await animeMediaService.getMediaPage({ malId, type, page, limit })

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
    { responseSchema: animeMediaListResponseSchema }
  )
)
