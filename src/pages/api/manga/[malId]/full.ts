/**
 * Extended printed-media (manga) detail API endpoint.
 *
 * @module pages/api/manga/[malId]/full
 *
 * **Route:** `GET /api/manga/:malId/full`
 *
 * **Authentication:** Public — no session required (nested under `/api/manga`).
 *
 * Returns the detail payload with nested objects: taxonomy as `{ malId, name }`,
 * every title (main, english, japanese, synonyms) and related works grouped by
 * relation type.
 *
 * @see {@link getMangaDetailsSchema} — request validation schema
 * @see {@link mangaFullDetailsResponseSchema} — response validation schema
 * @see {@link mangaFullService.getMangaFullByMalId} — extended detail service
 */
import type { APIContext, APIRoute } from 'astro'
import { withErrorHandling } from '@http/with-error-handling'
import { withZodValidation } from '@http/with-validation'
import { getMangaDetailsSchema } from '@manga/schemas/manga-details-schema'
import { mangaFullDetailsResponseSchema } from '@manga/schemas/manga-full-schema'
import { mangaFullService } from '@manga/services/manga-full'

/**
 * Returns the extended payload of a printed work.
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
 *     titles: Array<{ title: string; type: 'main' | 'english' | 'japanese' | 'synonym' }>
 *     genres: Array<{ malId: number; name: string }>
 *     themes: Array<{ malId: number; name: string }>
 *     demographics: Array<{ malId: number; name: string }>
 *     characters: Array<{ characterId: number; name: string; role: string; voiceActors: [...] }>
 *     relations: Array<{ relation: string; entry: Array<{ mangaId: number; title: string; url: string }> }>
 *   }
 *   status: 200
 *   meta: { stale: boolean }
 * }
 * ```
 *
 * **Error responses**
 *
 * | Status | Code | When |
 * |--------|------|------|
 * | 400 | `VALIDATION_ERROR` | `malId` is not a positive integer |
 * | 404 | `MANGA_NOT_FOUND` | No work exists for the given MAL ID |
 * | 503 | `DB_ERROR` | Database query failed |
 *
 * @example
 * ```bash
 * curl "http://localhost:4321/api/manga/2/full"
 * ```
 */
export const GET: APIRoute = withZodValidation(getMangaDetailsSchema)(
  withErrorHandling(
    async ({
      validated,
    }: APIContext & { validated: { params: { malId: number } } }) => {
      const { malId } = validated.params
      const { value: manga, isStale } =
        await mangaFullService.getMangaFullByMalId(malId)

      return {
        data: manga,
        status: 200,
        meta: { stale: isStale },
      }
    },
    { responseSchema: mangaFullDetailsResponseSchema }
  )
)
