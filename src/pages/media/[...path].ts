/**
 * Media image proxy and optimization endpoint.
 *
 * @module pages/media/[...path]
 *
 * **Route:** `GET /media/*`
 *
 * **Authentication:** Public — no session required ({@link isPublicRoute} allowlists `/media`).
 *
 * Resolves semantic media paths (entity type, ID, size), fetches the upstream asset,
 * optionally resizes/recompresses it, and returns raw image bytes. Validation failures
 * and service errors are returned as JSON envelopes consistent with other API routes.
 *
 * @see {@link mediaRequestSchema} — request validation schema
 * @see {@link mediaService.optimizeMedia} — fetch and optimization pipeline
 * @see {@link mapErrorToHttp} — error-to-HTTP mapping
 */

import { mapErrorToHttp } from '@shared/errors/map-error-to-http'
import { withZodValidation } from '@http/with-validation'
import { mediaRequestSchema } from '@domains/media/schemas/media-schema'
import { mediaService } from '@domains/media/services/media-service'
import type { APIRoute } from 'astro'

/**
 * Proxies and optimizes an entity media image for the given semantic path.
 *
 * @remarks
 * **Request**
 *
 * | Source | Field | Type | Required | Description |
 * |--------|-------|------|----------|-------------|
 * | Params | `path` | `string` | Yes | Catch-all route segments (e.g. `anime/123/poster/large`) |
 * | Query | `w` | `number` | No | Output width in pixels (positive integer) |
 * | Query | `q` | `number` | No | Output quality 1–100 |
 * | Query | `source` | `'myanimelist' \| 'anilist' \| 'kitsu' \| 'thetvdb' \| 'custom' \| 'youtube'` | No | Upstream source filter |
 *
 * **Success response — `200 OK`**
 *
 * Returns optimized image bytes (not JSON). Headers include `Content-Type` set to the
 * output MIME type (e.g. `image/webp`, `image/jpeg`).
 *
 * **Error responses** (JSON envelope: `{ data: null, status, error, meta }`)
 *
 * | Status | Code | When |
 * |--------|------|------|
 * | 400 | `VALIDATION_ERROR` | Params or query fail {@link mediaRequestSchema} validation |
 * | 500 | `INVALID_IMAGE_PATH` | Semantic path cannot be parsed or is invalid |
 * | 500 | `EXTERNAL_API_ERROR` | Upstream media fetch failed |
 * | 500 | `DB_ERROR` | Database lookup for media metadata failed |
 * | 500 | `CACHE_ERROR` | Cache read/write failure |
 * | 500 | `UNKNOWN_ERROR` | Unhandled throwable |
 *
 * @example
 * ```bash
 * curl -o poster.webp "http://localhost:4321/media/anime/5114/poster/large?w=400&q=85"
 * ```
 *
 * @example
 * ```typescript
 * const res = await fetch('/media/anime/5114/poster/large?w=400&q=85')
 * if (res.ok) {
 *   const blob = await res.blob()
 *   // use blob as image source
 * } else {
 *   const err = await res.json()
 *   // { data: null, status: 400, error: 'Invalid request', meta: { details: { issues: [...] } } }
 * }
 * ```
 */
export const GET: APIRoute = withZodValidation(mediaRequestSchema)(async ({
  validated,
}) => {
  try {
    const parsed = mediaService.parsePath(validated.params.path)

    const width = validated.query.w
    const quality = validated.query.q
    const source = validated.query.source
    const optimizedImage = await mediaService.optimizeMedia(parsed, {
      width,
      quality,
      source,
    })

    return new Response(new Uint8Array(optimizedImage.buffer), {
      headers: {
        'Content-Type': optimizedImage.mimeType,
      },
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
