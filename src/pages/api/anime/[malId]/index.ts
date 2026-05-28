/**
 * Anime detail page data API endpoint.
 *
 * @module pages/api/anime/[malId]/index
 *
 * **Route:** `GET /api/anime/:malId`
 *
 * **Authentication:** Public — no session required (nested under `/api/anime` public prefix).
 *
 * Returns core anime detail fields for public detail pages (title, synopsis, images, etc.).
 *
 * @see {@link getAnimeDetailsSchema} — request validation schema
 * @see {@link animeDetailsResponseSchema} — response validation schema
 * @see {@link animeService.getAnimeDetails} — detail query service
 * @see {@link mapErrorToHttp} — error-to-HTTP mapping
 */

import type { APIRoute } from 'astro'
import { withZodValidation } from '@http/with-validation'
import { animeService } from '@domains/anime/services/anime-service'
import { mapErrorToHttp } from '@shared/errors/map-error-to-http'
import {
  animeDetailsResponseSchema,
  getAnimeDetailsSchema,
} from '@domains/anime/schemas/anime-details-schema'

/**
 * Returns anime detail data for a MyAnimeList ID.
 *
 * @remarks
 * **Request**
 *
 * | Source | Field | Type | Required | Description |
 * |--------|-------|------|----------|-------------|
 * | Params | `malId` | `number` | Yes | MyAnimeList anime identifier (positive integer) |
 *
 * **Success response — `200 OK`**
 *
 * ```typescript
 * {
 *   data: {
 *     malId: number
 *     title: string
 *     year: number
 *     status: string
 *     genres: string[]
 *     themes: string[]
 *     synopsis: string
 *     demographics: string[]
 *     trailerUrl: string
 *     imageUrl: string
 *     smallImageUrl: string
 *     bannerImageUrl: string
 *     url: string
 *     slug: string
 *     shareText: string
 *     watchUrl: string
 *     altImageText: string
 *   }
 *   status: 200
 *   meta: {}
 * }
 * ```
 *
 * **Error responses** (JSON envelope: `{ data: null, status, error, meta }`)
 *
 * | Status | Code | When |
 * |--------|------|------|
 * | 400 | `VALIDATION_ERROR` | `malId` param fails Zod coercion/validation |
 * | 400 | `ANIME_INVALID_ID` | MAL ID is malformed or out of acceptable range |
 * | 404 | `ANIME_NOT_FOUND` | No anime exists for the given MAL ID |
 * | 500 | `DB_ERROR` | Database query failed |
 * | 500 | `CACHE_ERROR` | Cache read/write failure |
 * | 500 | `UNKNOWN_ERROR` | Unhandled throwable |
 *
 * @example
 * ```bash
 * curl "http://localhost:4321/api/anime/5114"
 * ```
 *
 * @example
 * ```typescript
 * const res = await fetch('/api/anime/5114')
 * const { data, status } = await res.json()
 * // data: AnimeDetails, status: 200
 * ```
 */
export const GET: APIRoute = withZodValidation(getAnimeDetailsSchema)(async ({
  validated,
}) => {
  try {
    const { malId } = validated.params

    const anime = await animeService.getAnimeDetails(malId)

    const payload = {
      data: anime,
      status: 200,
      meta: {},
    }

    const responseBody = animeDetailsResponseSchema.parse(payload)

    return new Response(JSON.stringify(responseBody), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    const { status, body } = mapErrorToHttp(error)

    const payload = {
      data: null,
      status,
      error: body.message ?? 'Unexpected error',
      meta: body.meta ?? {},
    }

    return new Response(JSON.stringify(payload), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
