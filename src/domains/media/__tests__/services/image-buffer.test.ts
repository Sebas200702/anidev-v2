/**
 * Tests for {@link optimizeMediaImageBuffer} and {@link fetchImageBuffer}.
 *
 * @module domains/media/__tests__/services/image-buffer
 * @remarks
 * `optimizeMediaImageBuffer` delegates to the shared optimizer; `fetchImageBuffer` normalizes the
 * URL, fetches via {@link fetchMediaAsset}, and rejects non-image content. Both dependencies are
 * mocked. Follows the repo TDD/unit-test layout.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { InfraError } from '@shared/errors/app-error'

vi.mock('@media/config', () => ({
  mediaServiceConfig: {
    defaultPlaceholderUrl: 'http://localhost/placeholder.webp',
  },
}))

const { optimizeImageBuffer, fetchMediaAsset } = vi.hoisted(() => ({
  optimizeImageBuffer: vi.fn(),
  fetchMediaAsset: vi.fn(),
}))

vi.mock('@utils/image/optimize-util', () => ({
  optimizeImageBuffer,
}))
vi.mock('@media/services/media-fetch', () => ({ fetchMediaAsset }))

import { optimizeMediaImageBuffer } from '@media/services/image-optimizer'
import { fetchImageBuffer } from '@media/services/fetch-image-buffer'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('optimizeMediaImageBuffer', () => {
  it('delegates to the shared optimizer', () => {
    optimizeImageBuffer.mockReturnValue({
      buffer: Buffer.from('x'),
      mimeType: 'image/webp',
    })
    const buffer = Buffer.from('src')

    const result = optimizeMediaImageBuffer(buffer, { width: 100 })

    expect(optimizeImageBuffer).toHaveBeenCalledWith(buffer, { width: 100 })
    expect(result).toEqual({ buffer: Buffer.from('x'), mimeType: 'image/webp' })
  })
})

describe('fetchImageBuffer', () => {
  it('returns the buffer for image content', async () => {
    fetchMediaAsset.mockResolvedValue({
      buffer: Buffer.from('img'),
      mimeType: 'image/png',
    })

    const result = await fetchImageBuffer('https://cdn/x.png')

    expect(result.toString()).toBe('img')
    expect(fetchMediaAsset).toHaveBeenCalledWith(
      'https://cdn/x.png',
      expect.objectContaining({ accept: expect.stringContaining('image/') })
    )
  })

  it('throws when the fetched resource is not an image', async () => {
    fetchMediaAsset.mockResolvedValue({
      buffer: Buffer.from('<html>'),
      mimeType: 'text/html',
    })

    await expect(fetchImageBuffer('https://cdn/x')).rejects.toBeInstanceOf(
      InfraError
    )
  })
})
