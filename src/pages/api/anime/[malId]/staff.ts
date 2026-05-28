/**
 * Anime staff list API endpoint.
 *
 * @module pages/api/anime/[malId]/staff
 *
 * **Route:** `GET /api/anime/:malId/staff`
 *
 * **Authentication:** Public — no session required (nested under `/api/anime` public prefix).
 *
 * Returns production staff credited on an anime with their positions.
 *
 * @see {@link getAnimeStaffSchema} — request validation schema
 * @see {@link animeStaffResponseSchema} — response validation schema
 * @see {@link animeStaffService.getAnimeStaff} — staff query service
 * @see {@link mapErrorToHttp} — error-to-HTTP mapping
 */

import type { APIRoute } from 'astro'
import { animeStaffService } from '@domains/anime/services/anime-staff-service'
import {
  getAnimeStaffSchema,
  animeStaffResponseSchema,
} from '@domains/anime/schemas/anime-staff-schema'
import { withZodValidation } from '@http/with-validation'
import { mapErrorToHttp } from '@shared/errors/map-error-to-http'

/**
 * Returns the staff list for a MyAnimeList anime ID.
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
 *     person: { malId: number; url: string; name: string; imageUrl: string | null }
 *     positions: string[]
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
 * curl "http://localhost:4321/api/anime/5114/staff"
 * ```
 *
 * @example
 * ```typescript
 * const res = await fetch('/api/anime/5114/staff')
 * const { data, meta } = await res.json()
 * // data: AnimeStaff[], meta.count: number
 * ```
 */
export const GET: APIRoute = withZodValidation(getAnimeStaffSchema)(async ({
  validated,
}) => {
  try {
    const { malId } = validated.params

    const staff = await animeStaffService.getAnimeStaff(malId)

    const payload = {
      data: staff,
      status: 200,
      meta: {
        count: staff.length,
      },
    }
    const responseBody = animeStaffResponseSchema.parse(payload)

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
