/**
 * Music detail API endpoint.
 *
 * @module pages/api/music/[id]
 *
 * **Route:** `GET /api/music/:id`
 *
 * **Authentication:** Public — no session required ({@link isPublicRoute} allowlists `/api/music`).
 *
 * Returns music metadata and playable version/resolution entries for an internal music ID.
 *
 * @see {@link getMusicSchema} — request validation schema
 * @see {@link musicDetailsResponseSchema} — response validation schema
 * @see {@link musicService.getMusicDetailsById} — music detail query service
 * @see {@link mapErrorToHttp} — error-to-HTTP mapping
 */

import type { APIContext, APIRoute } from 'astro'
import { withErrorHandling } from '@http/with-error-handling'
import { withZodValidation } from '@http/with-validation'
import { musicService } from '@music/services/music'
import {
  getMusicSchema,
  musicDetailsResponseSchema,
} from '@music/schemas/api-schema'

/**
 * Returns music detail metadata and playable versions by internal music ID.
 *
 * @remarks
 * **Request**
 *
 * | Source | Field | Type | Required | Description |
 * |--------|-------|------|----------|-------------|
 * | Params | `id` | `string` | Yes | Internal music identifier (coerced to number by service) |
 *
 * **Success response — `200 OK`**
 *
 * ```typescript
 * {
 *   data: {
 *     title: string
 *     type: 'opening' | 'ending' | 'unknown'
 *     typeCode: 'OP' | 'ED' | 'UNK'
 *     versions: Array<{
 *       musicId: number
 *       version: number
 *       versionId: number
 *       resolutions: Array<{
 *         resolution: string
 *         audioUrl: string
 *         videoUrl: string
 *         songId: number
 *       }>
 *     }>
 *     artist: Array<{ name: string; malId: number }>
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
 * | 400 | `VALIDATION_ERROR` | `id` param fails {@link getMusicSchema} validation |
 * | 400 | `MUSIC_INVALID_ID` | Music ID is malformed or not a valid number |
 * | 404 | `MUSIC_NOT_FOUND` | No music record exists for the given ID |
 * | 500 | `DB_ERROR` | Database query failed |
 * | 500 | `CACHE_ERROR` | Cache read/write failure |
 * | 500 | `UNKNOWN_ERROR` | Unhandled throwable |
 *
 * @example
 * ```bash
 * curl "http://localhost:4321/api/music/42"
 * ```
 *
 * @example
 * ```typescript
 * const res = await fetch('/api/music/42')
 * const { data } = await res.json()
 * // data: MusicDetails
 * ```
 */
export const GET: APIRoute = withZodValidation(getMusicSchema)(
  withErrorHandling(
    async ({
      validated,
    }: APIContext & { validated: { params: { id: string } } }) => {
      const { id } = validated.params
      const { value: musicDetails, isStale } =
        await musicService.getMusicDetailsById(Number(id))

      return {
        data: musicDetails,
        status: 200,
        meta: { stale: isStale },
      }
    },
    { responseSchema: musicDetailsResponseSchema }
  )
)
