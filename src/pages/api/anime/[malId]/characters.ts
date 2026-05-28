/**
 * Anime character list API endpoint.
 *
 * @module pages/api/anime/[malId]/characters
 *
 * **Route:** `GET /api/anime/:malId/characters`
 *
 * **Authentication:** Public — no session required (nested under `/api/anime` public prefix).
 *
 * Returns all characters credited on an anime, including voice actors and role metadata.
 *
 * @see {@link getAnimeCharacterSchema} — request validation schema
 * @see {@link animeCharacterResponseSchema} — response validation schema
 * @see {@link animeCharacterService.getAnimeCharacters} — character query service
 * @see {@link mapErrorToHttp} — error-to-HTTP mapping
 */

import type { APIRoute } from 'astro'
import { animeCharacterService } from '@domains/anime/services/anime-characters-service'
import {
  getAnimeCharacterSchema,
  animeCharacterResponseSchema,
} from '@domains/anime/schemas/anime-character-schema'
import { withZodValidation } from '@http/with-validation'
import { mapErrorToHttp } from '@shared/errors/map-error-to-http'

/**
 * Returns the character list for a MyAnimeList anime ID.
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
 *   data: Array<{
 *     malId: number
 *     url: string
 *     name: string
 *     role: string
 *     imageUrl: string | null
 *     about: string | null
 *     nameKanji: string | null
 *     voiceActors: Array<{ person: Person; language: string }>
 *   }>
 *   status: 200
 *   meta: { count: number }
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
 * curl "http://localhost:4321/api/anime/5114/characters"
 * ```
 *
 * @example
 * ```typescript
 * const res = await fetch('/api/anime/5114/characters')
 * const { data, meta } = await res.json()
 * // data: AnimeCharacter[], meta.count: number
 * ```
 */
export const GET: APIRoute = withZodValidation(getAnimeCharacterSchema)(async ({
  validated,
}) => {
  try {
    const { malId } = validated.params

    const characters = await animeCharacterService.getAnimeCharacters(malId)

    const payload = {
      data: characters,
      status: 200,
      meta: {
        count: characters.length,
      },
    }
    const responseBody = animeCharacterResponseSchema.parse(payload)

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
