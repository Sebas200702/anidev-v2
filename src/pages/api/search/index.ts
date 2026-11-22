/**
 * Catalog search API endpoint.
 *
 * @module pages/api/search/index
 *
 * **Route:** `GET /api/search?q=&type=anime|manga|music|characters`
 *
 * **Authentication:** Public — no session required.
 *
 * Searches anime, printed media (title and synonyms), music themes or
 * characters. Music and characters match their own title/name **or** the
 * title of a non-adult anime they belong to (`?q=bebop&type=music` lists the
 * themes of Cowboy Bebop).
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
 * | Query | `q` | `string` | Yes | Search term, 1–100 chars (2+ for characters) |
 * | Query | `type` | `anime \| manga \| music \| characters` | No | Catalog, default `anime` |
 * | Query | `page` / `limit` | `number` | No | Pagination (1–10000 / 1–100) |
 *
 * **Success response — `200 OK`**
 *
 * ```typescript
 * {
 *   data: AnimeCard[] | MangaCard[] | MusicCard[] | CharacterCard[]
 *   status: 200
 *   meta: { type, page, total, hasNext, stale }
 * }
 * ```
 *
 * **Error responses:** `400 VALIDATION_ERROR` (missing `q`, unknown `type`,
 * `q` shorter than 2 chars for `characters`, bad pagination), `503` on infrastructure failure.
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
