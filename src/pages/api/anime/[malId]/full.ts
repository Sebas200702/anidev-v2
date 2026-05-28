/**
 * Extended anime detail API endpoint.
 *
 * @module pages/api/anime/[malId]/full
 *
 * **Route:** `GET /api/anime/:malId/full`
 *
 * **Authentication:** Public — no session required (nested under `/api/anime` public prefix).
 *
 * Returns the expanded anime payload including relations, external IDs, music themes,
 * alternate titles, and full taxonomy metadata.
 *
 * @see {@link getAnimeFullSchema} — request validation schema
 * @see {@link animeFullDetailsResponseSchema} — response validation schema
 * @see {@link animeFullService.getAnimeFullByMalId} — full detail query service
 * @see {@link mapErrorToHttp} — error-to-HTTP mapping
 */

import type { APIRoute } from 'astro'
import { withZodValidation } from '@http/with-validation'
import { animeFullService } from '@domains/anime/services/anime-full-service'
import { mapErrorToHttp } from '@shared/errors/map-error-to-http'
import {
  animeFullDetailsResponseSchema,
  getAnimeFullSchema,
} from '@domains/anime/schemas/anime-full-schema'

/**
 * Returns extended anime detail data for a MyAnimeList ID.
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
 *     titles: Array<{ title: string; type: 'main' | 'english' | 'japanese' | 'synonym' }>
 *     year: number
 *     score: number
 *     scoredBy: number
 *     popularityRank: number
 *     rating: string
 *     season: string
 *     background: string
 *     status: string
 *     genres: Array<{ name: string; malId: number }>
 *     themes: Array<{ name: string; malId: number }>
 *     demographics: Array<{ name: string; malId: number }>
 *     synopsis: string
 *     media: Array<{ mediaType: string; src?: string; size: string }>
 *     relations: Array<{ relation: string; entry: Array<{ relatedId: number; title: string; url: string }> }>
 *     type: string
 *     episodes: number
 *     music: { openings: AnimeMusic[]; endings: AnimeMusic[] }
 *     externalIds: Array<{ id: number | string; source: string }>
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
 * curl "http://localhost:4321/api/anime/5114/full"
 * ```
 *
 * @example
 * ```typescript
 * const res = await fetch('/api/anime/5114/full')
 * const { data } = await res.json()
 * // data: AnimeFullDetails
 * ```
 */
export const GET: APIRoute = withZodValidation(getAnimeFullSchema)(async ({
  validated,
}) => {
  try {
    const { malId } = validated.params

    const anime = await animeFullService.getAnimeFullByMalId(malId)

    const payload = {
      data: anime,
      status: 200,
      meta: {},
    }

    const responseBody = animeFullDetailsResponseSchema.parse(payload)

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
