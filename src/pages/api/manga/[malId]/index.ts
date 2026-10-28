/**
 * Printed-media (manga) detail API endpoint.
 *
 * @module pages/api/manga/[malId]/index
 *
 * **Route:** `GET /api/manga/:malId`
 *
 * **Authentication:** Public — no session required.
 *
 * Returns the work with its taxonomy, cast, staff, publishers, related works
 * and external links.
 *
 * @see {@link getMangaDetailsSchema} — request validation schema
 * @see {@link mangaDetailsResponseSchema} — response validation schema
 * @see {@link mangaDetailsService.getMangaDetails} — detail query service
 */
import type { APIContext, APIRoute } from 'astro'
import { withErrorHandling } from '@http/with-error-handling'
import { withZodValidation } from '@http/with-validation'
import {
  getMangaDetailsSchema,
  mangaDetailsResponseSchema,
} from '@manga/schemas/manga-details-schema'
import { mangaDetailsService } from '@manga/services/manga-detail'

/**
 * Returns the detail payload of a printed work.
 *
 * @remarks
 * **Request**
 *
 * | Source | Field | Type | Required | Description |
 * |--------|-------|------|----------|-------------|
 * | Params | `malId` | `number` | Yes | MyAnimeList work identifier (positive integer) |
 *
 * **Success response — `200 OK`**
 *
 * ```typescript
 * {
 *   data: {
 *     malId: number
 *     title: string
 *     type: string
 *     chapters: number | null
 *     volumes: number | null
 *     synopsis: string
 *     genres: string[]
 *     characters: Array<{ characterId: number, name: string, role: string, imageUrl: string,
 *       voiceActors: Array<{ staffId: number, name: string, language: string, imageUrl: string }> }>
 *     staff: Array<{ staffId: number, name: string, role: string, imageUrl: string }>
 *     related: Array<{ mangaId: number, title: string, relationType: string }>
 *   }
 *   status: 200
 *   meta: {}
 * }
 * ```
 *
 * @example
 * ```bash
 * curl "http://localhost:4321/api/manga/1"
 * ```
 */
export const GET: APIRoute = withZodValidation(getMangaDetailsSchema)(
  withErrorHandling(
    async ({
      validated,
    }: APIContext & { validated: { params: { malId: number } } }) => {
      const { malId } = validated.params
      const { value: manga, isStale } =
        await mangaDetailsService.getMangaDetails(malId)

      return {
        data: manga,
        status: 200,
        meta: { stale: isStale },
      }
    },
    { responseSchema: mangaDetailsResponseSchema }
  )
)
