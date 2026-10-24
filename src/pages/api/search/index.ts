/**
 * Catalog search API endpoint.
 *
 * @module pages/api/search/index
 *
 * **Route:** `GET /api/search?q=&type=anime|manga`
 *
 * **Authentication:** Public — no session required.
 *
 * Searches the anime or the printed-media catalog by title and synonyms.
 *
 * @see {@link catalogSearchRequestSchema} — request validation schema
 * @see {@link catalogSearchResponseSchema} — response validation schema
 * @see {@link catalogSearchService.search} — search service
 */
import type { APIContext, APIRoute } from 'astro'
import { withErrorHandling } from '@http/with-error-handling'
import { withZodValidation } from '@http/with-validation'
import {
  catalogSearchRequestSchema,
  catalogSearchResponseSchema,
} from '@search/schemas/catalog-search-schema'
import {
  catalogSearchService,
  type CatalogSearchQuery,
} from '@search/services/catalog-search'

/**
 * Returns one page of cards of the searched catalog.
 *
 * @remarks
 * **Request**
 *
 * | Source | Field | Type | Required | Description |
 * |--------|-------|------|----------|-------------|
 * | Query | `q` | `string` | Yes | Search term, 1–100 chars |
 * | Query | `type` | `anime \| manga` | No | Catalog, default `anime` |
 * | Query | `page` / `limit` | `number` | No | Pagination (1–10000 / 1–100) |
 *
 * **Success response — `200 OK`**
 *
 * ```typescript
 * {
 *   data: AnimeCard[] | MangaCard[]
 *   status: 200
 *   meta: { type: 'anime' | 'manga', page, total, hasNext, stale }
 * }
 * ```
 *
 * **Error responses:** `400 VALIDATION_ERROR` (missing `q`, unknown `type`,
 * bad pagination), `503` on infrastructure failure.
 *
 * @example
 * ```bash
 * curl "http://localhost:4321/api/search?q=berserk&type=manga"
 * ```
 */
export const GET: APIRoute = withZodValidation(catalogSearchRequestSchema)(
  withErrorHandling(
    async ({
      validated,
    }: APIContext & { validated: { query: CatalogSearchQuery } }) => {
      const { query } = validated
      const {
        value: { type, list, total },
        isStale,
      } = await catalogSearchService.search(query)

      return {
        data: list,
        status: 200,
        meta: {
          type,
          stale: isStale,
          page: query.page,
          total,
          hasNext: query.page * query.limit < total,
        },
      }
    },
    { responseSchema: catalogSearchResponseSchema }
  )
)
