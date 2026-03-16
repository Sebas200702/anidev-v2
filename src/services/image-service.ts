import { createHash } from 'node:crypto'
import { ErrorCodes } from '@/core/errors/error-codes'
import { InfraError } from '@/core/errors/errors'
import { config } from '@/config'
import { logger } from '@/core/logging/logger'
import {
  optimizeImageBuffer,
  type OptimizeOptions,
} from '@/core/utils/image/optimize'

const DEFAULT_TIMEOUT_MS = 10_000
const DEFAULT_CACHE_TTL_SECONDS = 15 * 60
const MAX_CACHEABLE_IMAGE_BYTES = 128 * 1024
const PLACEHOLDER_URL = `${config.baseUrl}/placeholder.webp`
const PLACEHOLDER_CACHE_PREFIX = 'image:placeholder'
const OPTIMIZED_CACHE_PREFIX = 'image:optimized'

let placeholderBuffer: Buffer | null = null

function resolveMimeType(format?: OptimizeOptions['format']): string {
  return format === 'avif' ? 'image/avif' : 'image/webp'
}

function buildOptionsHash(options: OptimizeOptions): string {
  const normalized = {
    width: options.width ?? null,
    quality: options.quality ?? null,
    format: options.format ?? 'webp',
  }

  return createHash('sha1').update(JSON.stringify(normalized)).digest('hex')
}

async function getPlaceholderBuffer(): Promise<Buffer | undefined> {
  if (placeholderBuffer) return placeholderBuffer

  try {
    const response = await fetch(PLACEHOLDER_URL)
    if (!response.ok) {
      throw new InfraError(
        ErrorCodes.EXTERNAL_API_ERROR,
        `Failed to fetch placeholder image: ${response.statusText}`,
        { status: response.status, url: PLACEHOLDER_URL }
      )
    }

    const arrayBuffer = await response.arrayBuffer()
    placeholderBuffer = Buffer.from(arrayBuffer)
    return placeholderBuffer
  } catch (error) {
    logger.error(
      { error },
      '[ImageProxyService] Failed to fetch placeholder image, falling back to local file'
    )
  }
}

function buildCacheKey(imageUrl: string, options: OptimizeOptions): string {
  const payload = JSON.stringify({
    imageUrl,
    optionsHash: buildOptionsHash(options),
  })
  const hash = createHash('sha1').update(payload).digest('hex')
  return `${OPTIMIZED_CACHE_PREFIX}:${hash}`
}

function buildPlaceholderCacheKey(options: OptimizeOptions): string {
  return `${PLACEHOLDER_CACHE_PREFIX}:${buildOptionsHash(options)}`
}

async function getCachedImage(
  cacheKey: string,
  options: OptimizeOptions
): Promise<{ buffer: Buffer; mimeType: string } | null> {
  try {
    const { cacheGet } = await import('@/core/cache')
    const cached = await cacheGet<string>(cacheKey)
    if (!cached) return null

    return {
      buffer: Buffer.from(cached, 'base64'),
      mimeType: resolveMimeType(options.format),
    }
  } catch (error) {
    logger.warn({ error }, '[ImageProxyService] Cache get failed')
    return null
  }
}

async function setCachedImage(
  cacheKey: string,
  result: { buffer: Buffer; mimeType: string }
): Promise<void> {
  if (result.buffer.length > MAX_CACHEABLE_IMAGE_BYTES) {
    logger.debug(
      {
        cacheKey,
        bytes: result.buffer.length,
        maxBytes: MAX_CACHEABLE_IMAGE_BYTES,
      },
      '[ImageProxyService] Skipping cache for large image'
    )
    return
  }

  try {
    const { cacheSet } = await import('@/core/cache')
    const payload = result.buffer.toString('base64')
    await cacheSet(cacheKey, payload, { ttlSeconds: DEFAULT_CACHE_TTL_SECONDS })
  } catch (error) {
    logger.warn({ error }, '[ImageProxyService] Cache set failed')
  }
}

async function getOptimizedPlaceholder(
  options: OptimizeOptions,
  imageUrl: string
): Promise<{ buffer: Buffer; mimeType: string }> {
  const placeholderCacheKey = buildPlaceholderCacheKey(options)
  const cachedPlaceholder = await getCachedImage(placeholderCacheKey, options)
  if (cachedPlaceholder) return cachedPlaceholder

  const placeholder = await getPlaceholderBuffer()
  if (!placeholder) {
    throw new InfraError(
      ErrorCodes.EXTERNAL_API_ERROR,
      'Failed to fetch placeholder image',
      { url: imageUrl }
    )
  }

  const optimizedPlaceholder = await optimizeImageBuffer(placeholder, options)
  await setCachedImage(placeholderCacheKey, optimizedPlaceholder)
  return optimizedPlaceholder
}

async function fetchImageBuffer(
  imageUrl: string,
  signal: AbortSignal
): Promise<Buffer> {
  const response = await fetch(imageUrl, {
    signal,
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'image/webp,image/avif,image/apng,image/*,*/*;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      Referer: 'https://myanimelist.net/',
    },
  })

  if (!response.ok) {
    throw new InfraError(
      ErrorCodes.EXTERNAL_API_ERROR,
      `Failed to fetch image: ${response.statusText}`,
      { status: response.status, url: imageUrl }
    )
  }

  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

export const ImageProxyService = {
  async fetchAndOptimize(
    imageUrl: string,
    options: OptimizeOptions = {}
  ): Promise<{ buffer: Buffer; mimeType: string }> {
    if (!imageUrl || typeof imageUrl !== 'string') {
      logger.warn({ imageUrl }, '[ImageProxyService] Invalid image URL')
      return getOptimizedPlaceholder(options, imageUrl)
    }

    const cacheKey = buildCacheKey(imageUrl, options)
    const cached = await getCachedImage(cacheKey, options)
    if (cached) return cached

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS)

    try {
      const buffer = await fetchImageBuffer(imageUrl, controller.signal)

      const optimized = await optimizeImageBuffer(buffer, options)
      await setCachedImage(cacheKey, optimized)
      return optimized
    } catch (error) {
      logger.error(
        { error, imageUrl },
        '[ImageProxyService.fetchAndOptimize] Error'
      )

      try {
        return await getOptimizedPlaceholder(options, imageUrl)
      } catch (fallbackError) {
        logger.error(
          { fallbackError },
          '[ImageProxyService.fetchAndOptimize] Placeholder failed'
        )

        if (error instanceof InfraError) {
          throw error
        }

        throw new InfraError(
          ErrorCodes.EXTERNAL_API_ERROR,
          'Failed to fetch image',
          { url: imageUrl },
          error
        )
      }
    } finally {
      clearTimeout(timeoutId)
    }
  },
}
