/**
 * @module @domains/media/services/image-optimizer-service
 * @remarks Thin domain adapter over shared image optimization utilities. Converts raw image
 * buffers into web-ready formats as part of the media delivery pipeline.
 */
import {
  optimizeImageBuffer,
  type OptimizeOptions,
} from '@utils/image/optimize-util'

/**
 * Optimizes a raw image buffer using shared image utilities.
 *
 * @remarks Delegates to {@link optimizeImageBuffer} with optional width, quality, format, and
 * source hints. Used by {@link mediaService.optimizeMedia} after remote fetch completes.
 * @param buffer - Source image bytes downloaded from the asset `src` URL
 * @param options - Width, quality, format, and source options
 * @returns Optimized image buffer and MIME type suitable for HTTP response bodies
 * @throws May propagate sharp/optimization failures from the underlying utility
 * @see {@link mediaService.optimizeMedia} for cached pipeline orchestration
 * @see {@link OptimizedMedia} for the return shape
 * @example
 * ```typescript
 * const raw = await mediaService.fetchImageBuffer(asset.src)
 * const optimized = optimizeMediaImageBuffer(raw, { width: 400, quality: 75, format: 'webp' })
 * res.setHeader('Content-Type', optimized.mimeType)
 * res.send(optimized.buffer)
 * ```
 */
export const optimizeMediaImageBuffer = (
  buffer: Buffer,
  options: OptimizeOptions = {}
) => {
  return optimizeImageBuffer(buffer, options)
}
