/**
 * Paginated anime list API endpoint.
 *
 * @module pages/api/anime/index
 *
 * **Route:** `GET /api/anime`
 *
 * **Authentication:** Public — no session required ({@link isPublicRoute} allowlists `/api/anime`).
 *
 * Returns a filtered, paginated list of anime cards for browse and search flows.
 *
 * @see {@link animeListRequestSchema} — request validation schema
 * @see {@link animeListResponseSchema} — response validation schema
 * @see {@link animeListService.getAnimeList} — list query service
 * @see {@link searchHistoryService} — best-effort search-history recording
 * @see {@link withErrorHandling} — error-to-HTTP envelope wrapper
 */

import { withErrorHandling } from '@http/with-error-handling'
import { withZodValidation } from '@http/with-validation'
import {
  animeListRequestSchema,
  animeListResponseSchema,
} from '@anime/schemas/anime-list-schema'
import { animeListService } from '@anime/services/anime-list'
import { hasSearchIntent } from '@anime/utils'
import type { AnimeFiltersParams } from '@anime/types'
import { searchHistoryService } from '@search/services/search-history'
import type { APIContext, APIRoute } from 'astro'

/**
 * Returns a paginated, filterable anime card list.
 *
 * @remarks
 * **Request**
 *
 * | Source | Field | Type | Required | Default | Description |
 * |--------|-------|------|----------|---------|-------------|
 * | Query | `page` | `number` | No | `1` | Page number (integer ≥ 1) |
 * | Query | `limit` | `number` | No | `10` | Page size (integer 1–100) |
 * | Query | `genre` | `string` | No | — | Genre filter |
 * | Query | `status` | `string` | No | — | Airing status filter |
 * | Query | `rating` | `string` | No | — | Age rating filter |
 * | Query | `year` | `number` | No | — | Release year (1900–current year) |
 * | Query | `type` | `string` | No | — | Anime type filter (e.g. TV, Movie) |
 * | Query | `query` | `string` | No | — | Free-text search term |
 * | Query | `season` | `string` | No | — | Airing season filter |
 * | Query | `scoreMin` / `scoreMax` | `number` | No | — | Score range (0–10, `scoreMin ≤ scoreMax`) |
 * | Query | `sort` | `score \| year \| title \| relevance` | No | `score` | Sort field (`relevance` needs `query`) |
 * | Query | `order` | `asc \| desc` | No | `desc` | Sort direction |
 *
 * **Search history:** for an authenticated caller whose request carries real
 * search intent (a `query` term or any discovery filter — see
 * {@link ANIME_SEARCH_INTENT_KEYS}), a best-effort `scope: 'anime'` entry is
 * recorded via {@link searchHistoryService}. Failures never affect the response.
 *
 * **Success response — `200 OK`**
 *
 * ```typescript
 * {
 *   data: Array<{
 *     malId: number
 *     title: string
 *     year: number
 *     status: string
 *     score: number | null
 *     type: string
 *     imageUrl: string
 *     smallImageUrl: string
 *     altImageText: string
 *   }>
 *   status: 200
 *   meta: {
 *     page: number
 *     total: number
 *     hasNext: boolean
 *   }
 * }
 * ```
 *
 * **Error responses** (JSON envelope: `{ data: null, status, error, meta }`)
 *
 * | Status | Code | When |
 * |--------|------|------|
 * | 400 | `VALIDATION_ERROR` | Query params fail {@link animeListRequestSchema} validation |
 * | 500 | `DB_ERROR` | Database query failed |
 * | 500 | `CACHE_ERROR` | Cache read/write failure |
 * | 500 | `UNKNOWN_ERROR` | Unhandled throwable |
 * | 500 | `RESPONSE_VALIDATION_ERROR` | Response envelope fails its Zod schema (wrapper-level) |
 *
 * @example
 * ```bash
 * curl "http://localhost:4321/api/anime?page=1&limit=20&genre=Action&year=2024"
 * ```
 *
 * @example
 * ```typescript
 * const res = await fetch('/api/anime?page=1&limit=10&query=naruto')
 * const { data, meta } = await res.json()
 * // data: AnimeCard[], meta: { page, total, hasNext }
 * ```
 */
export const GET: APIRoute = withZodValidation(animeListRequestSchema)(
  withErrorHandling(
    async ({
      validated,
      locals,
    }: APIContext & { validated: { query: AnimeFiltersParams } }) => {
      const { query } = validated
      const {
        value: { list: animeCards, total },
        isStale,
      } = await animeListService.getAnimeList(query)

      // Best-effort: record the search for authenticated users when the request
      // carries real search intent. Never throws (service swallows failures).
      const userId = locals.user?.id
      if (userId && hasSearchIntent(query)) {
        const { page: _page, limit: _limit, ...filters } = query
        await searchHistoryService.record({
          userId,
          scope: 'anime',
          query: query.query ?? null,
          filters,
        })
      }

      return {
        data: animeCards,
        status: 200,
        meta: {
          stale: isStale,
          page: query.page,
          total,
          hasNext: query.page * query.limit < total,
        },
      }
    },
    { responseSchema: animeListResponseSchema }
  )
)
