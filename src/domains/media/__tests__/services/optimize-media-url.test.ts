/**
 * Tests for {@link optimizeMediaByUrl}.
 *
 * @module domains/media/__tests__/services/optimize-media-url
 * @remarks
 * `withCache` is mocked to run `compute`. Covers URL normalization and the fetch→optimize pipeline.
 * Follows the repo TDD/unit-test layout.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@media/config', () => ({
  mediaServiceConfig: {
    defaultPlaceholderUrl: 'http://localhost/placeholder.webp',
  },
}))
vi.mock('@lib/cache', () => ({
  withCache: async (opts: {
    key: string
    getCache: () => Promise<unknown>
    setCache: (k: string, v: unknown) => Promise<unknown>
    compute: () => Promise<unknown>
  }) => {
    await opts.getCache()
    const value = await opts.compute()
    await opts.setCache(opts.key, value)
    return value
  },
}))
vi.mock('@utils/image/optimize-util', () => ({
  normalizeOptimizeOptions: (o: unknown) => o,
}))
vi.mock('@media/cache/media-cache', () => ({
  mediaCache: {
    keyFromUrl: () => 'k',
    getFromUrl: vi.fn(),
    setFromUrl: vi.fn(),
  },
}))

const { fetchImageBuffer, optimize } = vi.hoisted(() => ({
  fetchImageBuffer: vi.fn(),
  optimize: vi.fn(),
}))

vi.mock('@media/services/fetch-image-buffer', () => ({ fetchImageBuffer }))
vi.mock('@media/services/image-optimizer', () => ({
  optimizeMediaImageBuffer: optimize,
}))

import { optimizeMediaByUrl } from '@media/services/optimize-media-url'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('optimizeMediaByUrl', () => {
  it('normalizes the URL, fetches, and optimizes', async () => {
    fetchImageBuffer.mockResolvedValue(Buffer.from('bytes'))
    optimize.mockReturnValue({
      buffer: Buffer.from('opt'),
      mimeType: 'image/webp',
    })

    const result = await optimizeMediaByUrl('  https://cdn/x.jpg  ')

    expect(fetchImageBuffer).toHaveBeenCalledWith('https://cdn/x.jpg')
    expect(result).toEqual({
      buffer: Buffer.from('opt'),
      mimeType: 'image/webp',
    })
  })

  it('falls back to the placeholder for a blank URL', async () => {
    fetchImageBuffer.mockResolvedValue(Buffer.from('bytes'))
    optimize.mockReturnValue({
      buffer: Buffer.from('opt'),
      mimeType: 'image/webp',
    })

    await optimizeMediaByUrl('   ')

    expect(fetchImageBuffer).toHaveBeenCalledWith(
      'http://localhost/placeholder.webp'
    )
  })
})
