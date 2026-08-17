/**
 * Tests for {@link optimizeMedia}.
 *
 * @module domains/media/__tests__/services/optimize-media
 * @remarks
 * `withCache` is mocked to run `compute` and evaluate `shouldCache`. Covers the null-path
 * {@link InfraError}, the resolve→fetch→optimize happy path, and the placeholder short-circuit that
 * disables caching. Follows the repo TDD/unit-test layout.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { InfraError } from '@shared/errors/app-error'
import { MediaEntity, MediaSize, MediaType } from '@media/types'

vi.mock('@media/config', () => ({
  mediaServiceConfig: {
    defaultPlaceholderUrl: 'http://localhost/placeholder.webp',
  },
}))

const { shouldCacheSpy } = vi.hoisted(() => ({ shouldCacheSpy: vi.fn() }))

vi.mock('@lib/cache', () => ({
  withCache: async (opts: {
    key: string
    getCache: () => Promise<unknown>
    setCache: (k: string, v: unknown) => Promise<unknown>
    compute: () => Promise<unknown>
    shouldCache?: (key: unknown, value: unknown) => boolean
  }) => {
    await opts.getCache()
    const value = await opts.compute()
    await opts.setCache(opts.key, value)
    shouldCacheSpy(opts.shouldCache?.('k', value))
    return value
  },
}))
vi.mock('@utils/image/optimize-util', () => ({
  normalizeOptimizeOptions: (o: unknown) => o,
}))
vi.mock('@media/cache/media-cache', () => ({
  mediaCache: { key: () => 'k', get: vi.fn(), set: vi.fn() },
}))

const { resolveMedia, fetchImageBuffer, optimize } = vi.hoisted(() => ({
  resolveMedia: vi.fn(),
  fetchImageBuffer: vi.fn(),
  optimize: vi.fn(),
}))

vi.mock('@media/services/resolve-media', () => ({ resolveMedia }))
vi.mock('@media/services/fetch-image-buffer', () => ({
  fetchImageBuffer,
}))
vi.mock('@media/services/image-optimizer', () => ({
  optimizeMediaImageBuffer: optimize,
}))

import type { SemanticMediaPath } from '@media/types'
import { optimizeMedia } from '@media/services/optimize-media'

const path: SemanticMediaPath = {
  entityType: MediaEntity.ANIME,
  entityId: 1,
  mediaType: MediaType.POSTER,
  mediaSize: MediaSize.LARGE,
  mediaId: 1,
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('optimizeMedia', () => {
  it('throws an InfraError for a null path', async () => {
    await expect(optimizeMedia(null)).rejects.toBeInstanceOf(InfraError)
  })

  it('resolves, fetches, and optimizes for a real asset (cacheable)', async () => {
    resolveMedia.mockResolvedValue({ src: 'https://cdn/real.jpg' })
    fetchImageBuffer.mockResolvedValue(Buffer.from('bytes'))
    optimize.mockReturnValue({
      buffer: Buffer.from('opt'),
      mimeType: 'image/webp',
    })

    const result = await optimizeMedia(path)

    expect(resolveMedia).toHaveBeenCalled()
    expect(fetchImageBuffer).toHaveBeenCalledWith('https://cdn/real.jpg')
    expect(result).toEqual({
      buffer: Buffer.from('opt'),
      mimeType: 'image/webp',
    })
    expect(shouldCacheSpy).toHaveBeenCalledWith(true)
  })

  it('does not cache when the resolved asset is the placeholder', async () => {
    resolveMedia.mockResolvedValue({ src: 'http://localhost/placeholder.webp' })
    fetchImageBuffer.mockResolvedValue(Buffer.from('bytes'))
    optimize.mockReturnValue({
      buffer: Buffer.from('opt'),
      mimeType: 'image/webp',
    })

    await optimizeMedia(path)

    expect(shouldCacheSpy).toHaveBeenCalledWith(false)
  })
})
