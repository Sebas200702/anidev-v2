/**
 * @module @domains/media/services/fetch-image-buffer-service
 * @remarks Downloads an image URL and validates that the response is an image before it enters
 * the optimization pipeline. Thin image-focused wrapper over {@link fetchMediaAsset}.
 */
import { ErrorCodes } from '@shared/errors/codes'
import { InfraError } from '@shared/errors/app-error'
import { normalizeImageUrl } from '@utils/image/normalize-image-url-util'
import { fetchMediaAsset } from '@domains/media/services/media-fetch-service'

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
export async function fetchImageBuffer(imageUrl: string): Promise<Buffer> {
  const normalizedImageUrl = normalizeImageUrl(imageUrl)
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
