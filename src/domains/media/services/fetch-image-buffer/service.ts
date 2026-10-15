/**
 * @module domains/media/services/fetch-image-buffer/service
 * @remarks Downloads an image URL and validates that the response is an image before it enters
 * the optimization pipeline. Thin image-focused wrapper over {@link fetchMediaAsset}.
 */
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ErrorCodes } from '@shared/errors/codes'
import { InfraError } from '@shared/errors/app-error'
import { mediaServiceConfig } from '@media/config'
import { normalizeImageUrl } from '@media/utils/image/normalize-image-url-util'
import { fetchMediaAsset } from '@media/services/media-fetch'

/**
 * Local candidates for the placeholder asset, in lookup order.
 *
 * @remarks `public/` serves development; `dist/client/` is the standalone
 * build output served in production.
 */
const PLACEHOLDER_CANDIDATES = [
  'public/placeholder.webp',
  'dist/client/placeholder.webp',
]

/**
 * Reads the placeholder image from local disk instead of self-fetching it.
 *
 * @remarks The placeholder URL is same-origin (`${APP_BASE_URL}/placeholder.webp`)
 * and network self-fetch would trip the SSRF guard on `http` dev origins.
 * @returns Placeholder bytes
 * @throws {InfraError} When no local copy exists
 */
export const readPlaceholderBuffer = async (): Promise<Buffer> => {
  for (const candidate of PLACEHOLDER_CANDIDATES) {
    const hit = await readFile(join(process.cwd(), candidate)).catch(() => null)
    if (hit) return hit
  }
  throw new InfraError(
    ErrorCodes.EXTERNAL_API_ERROR,
    'Placeholder asset missing from disk',
    { candidates: PLACEHOLDER_CANDIDATES }
  )
}

/**
 * Downloads an image URL and validates that the response is an image.
 *
 * @remarks Uses {@link fetchMediaAsset} with an image-focused Accept header, then verifies
 * the returned MIME type starts with `image/`.
 * @param imageUrl - Absolute source image URL
 * @returns Raw image bytes ready for optimization
 * @throws {InfraError} When fetching fails or the resource is not an image
 * @see {@link optimizeMediaImageBuffer} for the next pipeline stage
 * @example
 * ```typescript
 * const buffer = await fetchImageBuffer(asset.src)
 * const optimized = optimizeMediaImageBuffer(buffer, { width: 400 })
 * ```
 */
export const fetchImageBuffer = async (imageUrl: string): Promise<Buffer> => {
  const normalizedImageUrl = normalizeImageUrl(imageUrl)
  if (normalizedImageUrl === mediaServiceConfig.defaultPlaceholderUrl) {
    return readPlaceholderBuffer()
  }
  const media = await fetchMediaAsset(normalizedImageUrl, {
    accept: 'image/webp,image/avif,image/apng,image/*,*/*;q=0.8',
  })

  if (!media.mimeType.startsWith('image/')) {
    throw new InfraError(
      ErrorCodes.EXTERNAL_API_ERROR,
      'Fetched resource is not an image',
      { url: normalizedImageUrl, mimeType: media.mimeType }
    )
  }

  return media.buffer
}
