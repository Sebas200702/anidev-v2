/**
 * Image buffer optimization using Sharp — resize, re-encode, and guardrails for size and pixels.
 *
 * @module shared/utils/image/optimize-util
 * @remarks
 * Used by the media proxy pipeline to serve WebP/AVIF derivatives. Enforces hard limits before Sharp
 * decodes untrusted upstream images.
 *
 * @see {@link optimizeImageBuffer}
 * @see {@link normalizeOptimizeOptions}
 */

import { mediaServiceConfig } from '@media/config'
import sharp from 'sharp'
import type { OptimizeOptions } from './optimize-util-types'

export type {
  ImageFormat,
  ImageSource,
  OptimizeOptions,
} from './optimize-util-types'

/** Maximum input buffer size (10 MiB) before {@link ImageTooLargeError} is thrown. */
const MAX_SIZE_BYTES = 10 * 1024 * 1024
/** Maximum input pixel count passed to Sharp `limitInputPixels`. */
const MAX_PIXELS = 268402689

/**
 * Thrown when an input image exceeds the configured byte-size limit.
 *
 * @remarks
 * Not a {@link BaseError} subclass — callers should catch and map to HTTP 413/400 as appropriate.
 */
export class ImageTooLargeError extends Error {
  /** Maximum allowed input size in bytes (same value passed to the constructor). */
  maxBytes: number

  /**
   * @param maxBytes - Maximum allowed input size in bytes
   */
  constructor(maxBytes: number) {
    super('Image too large')
    this.name = 'ImageTooLargeError'
    this.maxBytes = maxBytes
  }
}

/**
 * Thrown when an empty image buffer reaches the optimizer.
 *
 * @remarks
 * Signals invalid upstream input before Sharp decodes. Callers should map to a
 * 400/404 response as appropriate.
 */
export class EmptyImageError extends Error {
  constructor() {
    super('Empty buffer')
    this.name = 'EmptyImageError'
  }
}

/**
 * Resizes and re-encodes an image buffer using Sharp.
 *
 * @param buffer - Raw image bytes from fetch or disk
 * @param options - Optional `width`, `quality` (default 50), and `format` (default `'webp'`)
 * @returns Optimized buffer and resulting MIME type (`image/webp` or `image/avif`)
 * @throws {EmptyImageError} When `buffer` is empty or missing
 * @throws {ImageTooLargeError} When `buffer.length` exceeds 10 MiB
 * @throws Sharp decode errors for corrupt images (propagated from Sharp)
 *
 * @remarks
 * **Algorithm**
 * 1. Reject empty buffers.
 * 2. Reject buffers over `MAX_SIZE_BYTES`.
 * 3. Create Sharp pipeline with `limitInputPixels` and `sequentialRead`.
 * 4. Optionally resize to `width` with `withoutEnlargement: true` (never upscale).
 * 5. Encode to `format` with `quality` and `effort: 3`.
 *
 * @example
 * ```typescript
 * const { buffer, mimeType } = await optimizeImageBuffer(raw, { width: 400, format: 'webp' })
 * // mimeType === 'image/webp'
 * ```
 */
export const optimizeImageBuffer = async (
  buffer: Buffer,
  { width, quality = 50, format = 'webp' }: OptimizeOptions = {}
): Promise<{ buffer: Buffer; mimeType: string }> => {
  if (!buffer || buffer.length === 0) {
    throw new EmptyImageError()
  }

  if (buffer.length > MAX_SIZE_BYTES) {
    throw new ImageTooLargeError(MAX_SIZE_BYTES)
  }

  let sharpInstance = sharp(buffer, {
    limitInputPixels: MAX_PIXELS,
    sequentialRead: true,
  })

  if (width && width > 0) {
    sharpInstance = sharpInstance.resize({
      width,
      withoutEnlargement: true,
    })
  }

  const optimizedBuffer = await sharpInstance
    .toFormat(format, { quality, effort: 3 })
    .toBuffer()

  const mimeType = format === 'avif' ? 'image/avif' : 'image/webp'

  return { buffer: optimizedBuffer, mimeType }
}

/**
 * Applies service defaults to partial optimization options from route query or config.
 *
 * @param options - Partial options from callers (may omit quality/format)
 * @returns New object with `quality` and `format` filled from {@link mediaServiceConfig} when absent
 *
 * @remarks
 * Does not mutate the input object. `width` and `source` pass through unchanged when provided.
 *
 * @see {@link optimizeImageBuffer}
 */
export const normalizeOptimizeOptions = (
  options: OptimizeOptions = {}
): OptimizeOptions => ({
  width: options.width,
  quality: options.quality ?? mediaServiceConfig.defaultQuality,
  format: options.format ?? mediaServiceConfig.defaultFormat,
  source: options.source,
})
