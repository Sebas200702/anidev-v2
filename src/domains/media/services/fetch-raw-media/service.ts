/**
 * @module domains/media/services/fetch-raw-media/service
 * @remarks Resolves and streams raw media bytes for a semantic path.
 * No optimization or transcoding is performed; bytes flow from the upstream
 * response to the client without full buffering or `tmpdir()` file caching.
 */
import { ErrorCodes } from '@shared/errors/codes'
import { DomainError } from '@shared/errors/app-error'
import { mediaServiceConfig } from '@media/config'
import { fetchMediaStream } from '@media/services/media-fetch'
import { resolveMedia } from '@media/services/resolve-media'
import { mediaCache } from '@media/cache/media-cache'
import type { MediaAsset, SemanticMediaPath } from '@media/types/media-types'
import type { FetchedMediaStream } from '@media/services/media-fetch'

export interface RawMediaStream extends FetchedMediaStream {
  src: string
}

/**
 * Resolves and streams raw media bytes for a semantic path.
 *
 * @remarks Pipeline: resolve asset (via cached `src` meta or repositories) →
 * MIME allowlist → zero-buffer upstream stream. The resolved `src` URL stays
 * cached in {@link mediaCache} metadata; response bytes are never written to
 * disk. An optional client `Range` header is forwarded upstream and a `206`
 * partial response is propagated with its `Content-Range`.
 * @param params - Parsed media path segments, or `null` when invalid
 * @param overrides - Optional version/resolution overrides plus client range
 * @returns Upstream stream with MIME type, status, and range metadata
 * @throws {DomainError} With `INVALID_IMAGE_PATH` for null paths or
 * disallowed MIME types; with `MEDIA_NOT_FOUND` when no asset exists
 * @example
 * ```typescript
 * const raw = await fetchRawMedia(parsedPath, { range: 'bytes=0-1023' })
 * return new Response(raw.stream, { status: raw.status })
 * ```
 */
export const fetchRawMedia = async (
  params: SemanticMediaPath | null,
  overrides?: { version?: string; resolution?: string; range?: string }
): Promise<RawMediaStream> => {
  if (!params) {
    throw new DomainError(ErrorCodes.INVALID_IMAGE_PATH, 'Invalid media path', {
      params,
    })
  }

  const mergedParams = {
    ...params,
    version: overrides?.version ?? params.version,
    resolution: overrides?.resolution ?? params.resolution,
  }

  const cachedMeta = await mediaCache.getRawMeta(mergedParams)
  const src = cachedMeta?.src ?? null

  let media: MediaAsset
  if (src) {
    media = { id: 0, mediaType: params.mediaType, src, size: null }
  } else {
    media = await resolveMedia(mergedParams)
    if (media.src !== mediaServiceConfig.defaultPlaceholderUrl) {
      await mediaCache.setRawMeta(mergedParams, { src: media.src })
    }
  }

  if (media.src === mediaServiceConfig.defaultPlaceholderUrl) {
    throw new DomainError(ErrorCodes.MEDIA_NOT_FOUND, 'Media not found', {
      params,
    })
  }

  const fetched = await fetchMediaStream(media.src, {
    range: overrides?.range,
  })

  const allowedRawMime =
    fetched.mimeType === 'application/octet-stream' ||
    fetched.mimeType.startsWith('image/') ||
    fetched.mimeType.startsWith('video/') ||
    fetched.mimeType.startsWith('audio/')
  if (!allowedRawMime) {
    fetched.stream.cancel().catch(() => {})
    throw new DomainError(
      ErrorCodes.INVALID_IMAGE_PATH,
      'Raw media MIME type is not allowed',
      { mimeType: fetched.mimeType }
    )
  }

  return { ...fetched, src: media.src }
}
