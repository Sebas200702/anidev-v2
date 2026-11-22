/**
 * Anime music list API endpoint.
 *
 * @module pages/api/anime/[malId]/music
 *
 * **Route:** `GET /api/anime/:malId/music`
 *
 * **Authentication:** Public — nested under the `/api/anime` public prefix.
 *
 * Returns the anime's openings and endings, optionally filtered by type and
 * paginated.
 *
 * @see {@link getAnimeMusicListSchema} — request validation schema
 * @see {@link animeMusicListResponseSchema} — response validation schema
 * @see {@link animeMusicService.getMusicPage} — page query service
 */
import type { APIContext, APIRoute } from 'astro'
import {
  animeMusicListResponseSchema,
  getAnimeMusicListSchema,
} from '@anime/schemas/anime-music-schema'
import { animeMusicService } from '@anime/services/anime-music'
import type { AnimeMusicItem } from '@anime/types'
import { withErrorHandling } from '@http/with-error-handling'
import { withZodValidation } from '@http/with-validation'

type MusicListContext = APIContext & {
  validated: {
    params: { malId: number }
    query: { type?: AnimeMusicItem['type']; page: number; limit: number }
  }
}

/**
 * Returns a page of openings and endings for a MyAnimeList anime ID.
 *
 * @remarks
 * **Request**
 *
 * | Source | Field | Type | Required | Description |
 * |--------|-------|------|----------|-------------|
 * | Params | `malId` | `number` | Yes | MyAnimeList anime identifier |
 * | Query | `type` | `string` | No | `opening` or `ending`, case-insensitive |
 * | Query | `page` | `number` | No | 1–1 000, default `1` |
 * | Query | `limit` | `number` | No | 1–100, default `24` |
 *
 * **Success — `200 OK`:** `data: AnimeMusicItem[]`,
 * `meta: { stale, page, limit, total, hasNext }`. An existing anime with no
 * matching music is an empty list.
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
 * curl "http://localhost:4321/api/anime/1/music?type=opening&page=1&limit=24"
 * ```
 */
export const GET: APIRoute = withZodValidation(getAnimeMusicListSchema)(
  withErrorHandling(
    async ({ validated }: MusicListContext) => {
      const { malId } = validated.params
      const { type, page, limit } = validated.query
      const {
        value: { list, total },
        isStale,
      } = await animeMusicService.getMusicPage({ malId, type, page, limit })

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
    { responseSchema: animeMusicListResponseSchema }
  )
)
