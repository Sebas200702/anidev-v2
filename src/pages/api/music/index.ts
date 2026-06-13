/**
 * Paginated music list API endpoint.
 *
 * @module pages/api/music/index
 *
 * **Route:** `GET /api/music`
 *
 * **Authentication:** Public — no session required ({@link isPublicRoute} allowlists `/api/music`).
 *
 * Returns a filtered, paginated list of music cards for browse and search flows.
 *
 * @see {@link musicListRequestSchema} — request validation schema
 * @see {@link musicListResponseSchema} — response validation schema
 * @see {@link musicListService.getMusicList} — list query service
 * @see {@link mapErrorToHttp} — error-to-HTTP mapping
 */

import { mapErrorToHttp } from '@shared/errors/map-error-to-http'
import { withZodValidation } from '@http/with-validation'
import {
  musicListRequestSchema,
  musicListResponseSchema,
} from '@domains/music/schemas/music-list-schema'
import { musicListService } from '@domains/music/services/music-list-service'
import type { APIRoute } from 'astro'

/**
 * Returns a paginated, filterable music card list.
 *
 * @remarks
 * **Request**
 *
 * | Source | Field | Type | Required | Default | Description |
 * |--------|-------|------|----------|---------|-------------|
 * | Query | `page` | `number` | No | `1` | Page number (integer ≥ 1) |
 * | Query | `limit` | `number` | No | `10` | Page size (integer 1–100) |
 * | Query | `type` | `string` | No | — | Music type: `OP`, `ED`, `UNK`, or labels `opening` / `ending` |
 * | Query | `query` | `string` | No | — | Free-text search on title |
 *
 * **Success response — `200 OK`**
 *
 * ```typescript
 * {
 *   data: Array<{
 *     id: number
 *     title: string
 *     type: 'opening' | 'ending' | 'unknown'
 *     typeCode: 'OP' | 'ED' | 'UNK'
 *     artists: Array<{ name: string; malId: number }>
 *   }>
 *   status: 200
 *   meta: {
 *     page: number
 *     total: number
 *     hasNext: boolean
 *   }
 * }
 * ```
 *
 * **Error responses** (JSON envelope: `{ data: null, status, error, meta }`)
 *
 * | Status | Code | When |
 * |--------|------|------|
 * | 400 | `VALIDATION_ERROR` | Query params fail {@link musicListRequestSchema} validation |
 * | 500 | `DB_ERROR` | Database query failed |
 * | 500 | `CACHE_ERROR` | Cache read/write failure |
 * | 500 | `UNKNOWN_ERROR` | Unhandled throwable |
 *
 * @example
 * ```bash
 * curl "http://localhost:4321/api/music?page=1&limit=20&type=OP&query=unravel"
 * ```
 *
 * @example
 * ```typescript
 * const res = await fetch('/api/music?page=1&limit=10&type=opening')
 * const { data, meta } = await res.json()
 * // data: MusicCard[], meta: { page, total, hasNext }
 * ```
 */
export const GET: APIRoute = withZodValidation(musicListRequestSchema)(async ({
  validated,
}) => {
  try {
    const { list: musicCards, total } = await musicListService.getMusicList(
      validated.query
    )
    const payload = {
      data: musicCards,
      status: 200,
      meta: {
        page: validated.query.page,
        total,
        hasNext: validated.query.page * validated.query.limit < total,
      },
    }
    const responseBody = musicListResponseSchema.parse(payload)

    return new Response(JSON.stringify(responseBody), {
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
