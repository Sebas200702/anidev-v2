import sharp from 'sharp'

export type ImageFormat = 'webp' | 'avif'

export type OptimizeOptions = {
  width?: number
  quality?: number
  format?: ImageFormat
}

const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10MB
const MAX_PIXELS = 268402689 // ~16k x 16k

export class ImageTooLargeError extends Error {
  maxBytes: number
  constructor(maxBytes: number) {
    super('Image too large')
    this.name = 'ImageTooLargeError'
    this.maxBytes = maxBytes
  }
}

export async function optimizeImageBuffer(
  buffer: Buffer,
  { width, quality = 50, format = 'webp' }: OptimizeOptions = {}
): Promise<{ buffer: Buffer; mimeType: string }> {
  if (!buffer || buffer.length === 0) {
    throw new Error('Empty buffer')
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
