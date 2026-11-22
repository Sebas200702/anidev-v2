/**
 * Anime media detail API endpoint.
 *
 * @module pages/api/anime/[malId]/media/[mediaId]
 *
 * **Route:** `GET /api/anime/:malId/media/:mediaId`
 *
 * **Authentication:** Public — nested under the `/api/anime` public prefix.
 *
 * Returns one media asset of an anime by its `id`, with the same proxy URL the
 * list endpoint exposes.
 *
 * @see {@link getAnimeMediaItemSchema} — request validation schema
 * @see {@link animeMediaItemResponseSchema} — response validation schema
 * @see {@link animeMediaService.getMediaItem} — detail query service
 */
import type { APIContext, APIRoute } from 'astro'
import {
  animeMediaItemResponseSchema,
  getAnimeMediaItemSchema,
} from '@anime/schemas/anime-media-schema'
import { animeMediaService } from '@anime/services/anime-media'
import { withErrorHandling } from '@http/with-error-handling'
import { withZodValidation } from '@http/with-validation'

type MediaItemContext = APIContext & {
  validated: { params: { malId: number; mediaId: number } }
}

/**
 * Returns one media asset of a MyAnimeList anime.
 *
 * @remarks
 * **Success — `200 OK`:** `data: AnimeMediaItem`, `meta: { stale }`.
 *
 * **Errors**
 *
 * | Status | Code | When |
 * |--------|------|------|
 * | 400 | `VALIDATION_ERROR` | `malId` or `mediaId` not a positive integer |
 * | 404 | `ANIME_NOT_FOUND` | No anime exists for `malId` |
 * | 404 | `MEDIA_NOT_FOUND` | The anime has no media asset with that id |
 * | 503 | `DB_ERROR` | Database down and no stale copy |
 *
 * @example
 * ```bash
 * curl "http://localhost:4321/api/anime/1/media/3"
 * ```
 */
export const GET: APIRoute = withZodValidation(getAnimeMediaItemSchema)(
  withErrorHandling(
    async ({ validated }: MediaItemContext) => {
      const { malId, mediaId } = validated.params
      const { value: item, isStale } = await animeMediaService.getMediaItem(
        malId,
        mediaId
      )

      return { data: item, status: 200, meta: { stale: isStale } }
    },
    { responseSchema: animeMediaItemResponseSchema }
  )
)
