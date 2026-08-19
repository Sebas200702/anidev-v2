/**
 * Featured-anime carousel API endpoint.
 *
 * @module pages/api/anime/carousel
 *
 * **Route:** `GET /api/anime/carousel`
 *
 * **Authentication:** Public — no session required ({@link isPublicRoute} allowlists `/api/anime`).
 *
 * Returns the slides rendered by the home hero: the most popular anime that
 * have both a banner and a clear logo.
 *
 * @see {@link getAnimeCarouselSchema} — request validation schema
 * @see {@link animeCarouselResponseSchema} — response validation schema
 * @see {@link animeCarouselService.getCarouselItems} — slide builder
 */
import {
  animeCarouselResponseSchema,
  getAnimeCarouselSchema,
} from '@anime/schemas/anime-carousel-schema'
import { animeCarouselService } from '@anime/services/anime-carousel'
import { withErrorHandling } from '@http/with-error-handling'
import { withZodValidation } from '@http/with-validation'
import type { APIRoute } from 'astro'

/**
 * Returns the featured-anime slides.
 *
 * @remarks
 * **Request:** no parameters.
 *
 * **Success response — `200 OK`**
 *
 * ```typescript
 * {
 *   data: Array<{
 *     malId: number
 *     title: string
 *     clearLogo: string
 *     bannerImage: string
 *     description: string
 *     genres: Array<{ malId: number; name: string; url: string }>
 *     score: number
 *     year: number
 *     season: string
 *   }>
 *   status: 200
 *   meta: {}
 * }
 * ```
 *
 * **Error responses** (JSON envelope: `{ data: null, status, error, meta }`)
 *
 * | Status | Code | When |
 * |--------|------|------|
 * | 500 | `DB_ERROR` | Database query failed |
 * | 500 | `CACHE_ERROR` | Cache read/write failure |
 * | 500 | `UNKNOWN_ERROR` | Unhandled throwable |
 * | 500 | `RESPONSE_VALIDATION_ERROR` | Response envelope fails its Zod schema (wrapper-level) |
 *
 * @example
 * ```bash
 * curl "http://localhost:4321/api/anime/carousel"
 * ```
 */
export const GET: APIRoute = withZodValidation(getAnimeCarouselSchema)(
  withErrorHandling(
    async () => {
      const items = await animeCarouselService.getCarouselItems()

      return {
        data: items,
        status: 200,
        meta: {},
      }
    },
    { responseSchema: animeCarouselResponseSchema }
  )
)
