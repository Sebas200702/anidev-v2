import { cacheGet, cacheSet } from '@/core/cache'
import { CacheTtl } from '@/core/cache/config'
import type { OptimizeOptions } from '@/core/utils/image/optimize'
import type { OptimizedMedia, SemanticMediaPath } from '../types/media'

type CachedOptimizedMedia = {
  buffer: string
  mimeType: string
}

const serializeImage = (image: OptimizedMedia): CachedOptimizedMedia => ({
  buffer: image.buffer.toString('base64'),
  mimeType: image.mimeType,
})

const deserializeImage = (
  payload: CachedOptimizedMedia | string | null
): OptimizedMedia | null => {
  if (!payload) return null

  let parsed: CachedOptimizedMedia

  try {
    parsed = typeof payload === 'string' ? JSON.parse(payload) : payload
  } catch {
    return null
  }

  if (!parsed?.buffer || !parsed?.mimeType) {
    return null
  }

  return {
    buffer: Buffer.from(parsed.buffer, 'base64'),
    mimeType: parsed.mimeType,
  }
}

const buildKey = (
  params: SemanticMediaPath | string,
  options: OptimizeOptions
): string => {
  if (typeof params === 'string') {
    return `optimized:url:${params}:w${options.width ?? 'auto'}:q${options.quality ?? 'auto'}:f${options.format ?? 'webp '}s:${options.source ?? ''}`
  }

  return `optimized:${params.entityType}:${params.entityId}:${params.mediaType}:${params.mediaSize}:${params.mediaId ?? 1}:w${options.width ?? 'auto'}:q${options.quality ?? 'auto'}:f${options.format ?? 'webp'} s:${options.source ?? ''}`
}

export const mediaCache = {
  key(params: SemanticMediaPath, options: OptimizeOptions) {
    return buildKey(params, options)
  },
  keyFromUrl(imageUrl: string, options: OptimizeOptions) {
    return buildKey(imageUrl, options)
  },
  async get(
    params: SemanticMediaPath,
    options: OptimizeOptions
  ): Promise<OptimizedMedia | null> {
    const cacheKey = this.key(params, options)
    const cached = await cacheGet<CachedOptimizedMedia | string>(cacheKey)

    return deserializeImage(cached)
  },
  async getFromUrl(
    imageUrl: string,
    options: OptimizeOptions
  ): Promise<OptimizedMedia | null> {
    const cacheKey = this.keyFromUrl(imageUrl, options)
    const cached = await cacheGet<CachedOptimizedMedia | string>(cacheKey)

    return deserializeImage(cached)
  },
  async set(
    params: SemanticMediaPath,
    options: OptimizeOptions,
    image: OptimizedMedia
  ): Promise<void> {
    const cacheKey = this.key(params, options)

    await cacheSet(cacheKey, serializeImage(image), {
      ttlSeconds: CacheTtl.Long,
    })
  },
  async setFromUrl(
    imageUrl: string,
    options: OptimizeOptions,
    image: OptimizedMedia
  ): Promise<void> {
    const cacheKey = this.keyFromUrl(imageUrl, options)

    await cacheSet(cacheKey, serializeImage(image), {
      ttlSeconds: CacheTtl.Long,
    })
  },
}

export { mediaCache as imageCache }
