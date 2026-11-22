/**
 * Anime music detail API endpoint.
 *
 * @module pages/api/anime/[malId]/music/[musicId]
 *
 * **Route:** `GET /api/anime/:malId/music/:musicId`
 *
 * **Authentication:** Public — nested under the `/api/anime` public prefix.
 *
 * Returns one opening or ending of an anime by its music `id`, with the same
 * shape the list endpoint exposes.
 *
 * @see {@link getAnimeMusicItemSchema} — request validation schema
 * @see {@link animeMusicItemResponseSchema} — response validation schema
 * @see {@link animeMusicService.getMusicItem} — detail query service
 */
import type { APIContext, APIRoute } from 'astro'
import {
  animeMusicItemResponseSchema,
  getAnimeMusicItemSchema,
} from '@anime/schemas/anime-music-schema'
import { animeMusicService } from '@anime/services/anime-music'
import { withErrorHandling } from '@http/with-error-handling'
import { withZodValidation } from '@http/with-validation'

type MusicItemContext = APIContext & {
  validated: { params: { malId: number; musicId: number } }
}

/**
 * Returns one opening or ending of a MyAnimeList anime.
 *
 * @remarks
 * **Success — `200 OK`:** `data: AnimeMusicItem`, `meta: { stale }`.
 *
 * **Errors**
 *
 * | Status | Code | When |
 * |--------|------|------|
 * | 400 | `VALIDATION_ERROR` | `malId` or `musicId` not a positive integer |
 * | 404 | `ANIME_NOT_FOUND` | No anime exists for `malId` |
 * | 404 | `MUSIC_NOT_FOUND` | The anime has no opening/ending with that id |
 * | 503 | `DB_ERROR` | Database down and no stale copy |
 *
 * @example
 * ```bash
 * curl "http://localhost:4321/api/anime/1/music/10"
 * ```
 */
export const GET: APIRoute = withZodValidation(getAnimeMusicItemSchema)(
  withErrorHandling(
    async ({ validated }: MusicItemContext) => {
      const { malId, musicId } = validated.params
      const { value: item, isStale } = await animeMusicService.getMusicItem(
        malId,
        musicId
      )

      return { data: item, status: 200, meta: { stale: isStale } }
    },
    { responseSchema: animeMusicItemResponseSchema }
  )
)
