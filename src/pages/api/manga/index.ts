/**
 * Paginated printed-media (manga) list API endpoint.
 *
 * @module pages/api/manga/index
 *
 * **Route:** `GET /api/manga`
 *
 * **Authentication:** Public — no session required.
 *
 * Returns a filtered, paginated list of printed works (manga, novels,
 * one-shots) for browse and search flows.
 *
 * @see {@link mangaFiltersParamsSchema} — request validation schema
 * @see {@link mangaListResponseSchema} — response validation schema
 * @see {@link mangaListService.getMangaList} — list query service
 * @see {@link withErrorHandling} — error-to-HTTP envelope wrapper
 */
import { withErrorHandling } from '@http/with-error-handling'
import { withZodValidation } from '@http/with-validation'
import {
  mangaListRequestSchema,
  mangaListResponseSchema,
} from '@manga/schemas/manga-schema'
import { mangaListService } from '@manga/services/manga-service'
import type { MangaFiltersParams } from '@manga/types'
import type { APIContext, APIRoute } from 'astro'

/**
 * Returns a paginated, filterable printed-media card list.
 *
 * @remarks
 * **Request**
 *
 * | Source | Field | Type | Required | Default | Description |
 * |--------|-------|------|----------|---------|-------------|
 * | Query | `page` | `number` | No | `1` | Page number (integer ≥ 1) |
 * | Query | `limit` | `number` | No | `10` | Page size (integer 1–100) |
 * | Query | `type` | `string` | No | — | `manga`, `novel`, `one_shot`, … |
 * | Query | `genre` | `string` | No | — | Genre name(s), comma-separated |
 * | Query | `theme` | `string` | No | — | Theme name(s) |
 * | Query | `demographic` | `string` | No | — | Demographic name(s) |
 * | Query | `status` | `string` | No | — | Publication status |
 * | Query | `year` | `number` | No | — | Publication year |
 * | Query | `query` | `string` | No | — | Free-text search term |
 * | Query | `scoreMin` / `scoreMax` | `number` | No | — | Score range (0–10) |
 * | Query | `sort` | `score \| year \| title` | No | `score` | Sort field |
 * | Query | `order` | `asc \| desc` | No | `desc` | Sort direction |
 *
 * **Success response — `200 OK`**
 *
 * ```typescript
 * {
 *   data: Array<{
 *     malId: number
 *     title: string
 *     type: string
 *     year: number
 *     status: string
 *     score: number | null
 *     chapters: number | null
 *     imageUrl: string
 *     smallImageUrl: string
 *     altImageText: string
 *   }>
 *   status: 200
 *   meta: { page: number, total: number, hasNext: boolean }
 * }
 * ```
 *
 * @example
 * ```bash
 * curl "http://localhost:4321/api/manga?page=1&limit=20&type=novel"
 * ```
 */
export const GET: APIRoute = withZodValidation(mangaListRequestSchema)(
  withErrorHandling(
    async ({
      validated,
    }: APIContext & { validated: { query: MangaFiltersParams } }) => {
      const { query } = validated
      const {
        value: { list: mangaCards, total },
        isStale,
      } = await mangaListService.getMangaList(query)

      return {
        data: mangaCards,
        status: 200,
        meta: {
          stale: isStale,
          page: query.page,
          total,
          hasNext: query.page * query.limit < total,
        },
      }
    },
    { responseSchema: mangaListResponseSchema }
  )
)
