/**
 * Tests for {@link optimizeImageBuffer} and {@link normalizeOptimizeOptions} with real images.
 *
 * @module shared/__tests__/utils/image/optimize-util-sharp
 * @remarks
 * Uses `sharp` to synthesize a tiny real image, then exercises the resize + format branches and the
 * {@link ImageTooLargeError} guard. `@media/config` is mocked for the option defaults. Follows the
 * repo TDD/unit-test layout.
 */
import { beforeAll, describe, expect, it, vi } from 'vitest'
import sharp from 'sharp'

vi.mock('@media/config', () => ({
  mediaServiceConfig: {
    defaultQuality: 75,
    defaultFormat: 'webp',
    defaultPlaceholderUrl: 'http://localhost/placeholder.webp',
    supportedMediaTypes: [],
    supportedEntities: [],
  },
}))

import {
  ImageTooLargeError,
  normalizeOptimizeOptions,
  optimizeImageBuffer,
} from '@utils/image/optimize-util'

let png: Buffer

beforeAll(async () => {
  png = await sharp({
    create: {
      width: 8,
      height: 8,
      channels: 3,
      background: { r: 200, g: 10, b: 10 },
    },
  })
    .png()
    .toBuffer()
})

describe('optimizeImageBuffer', () => {
  it('encodes to webp by default', async () => {
    const result = await optimizeImageBuffer(png)
    expect(result.mimeType).toBe('image/webp')
    expect(result.buffer.length).toBeGreaterThan(0)
  })

  it('resizes when a width is given', async () => {
    const result = await optimizeImageBuffer(png, { width: 4 })
    const meta = await sharp(result.buffer).metadata()
    expect(meta.width).toBe(4)
  })

  it('encodes to avif with the avif mime type', async () => {
    const result = await optimizeImageBuffer(png, { format: 'avif' })
    expect(result.mimeType).toBe('image/avif')
  })

  it('rejects buffers over the size limit', async () => {
    const tooBig = Buffer.alloc(10 * 1024 * 1024 + 1)
    await expect(optimizeImageBuffer(tooBig)).rejects.toBeInstanceOf(
      ImageTooLargeError
    )
  })
})

describe('normalizeOptimizeOptions', () => {
  it('fills defaults from the media config', () => {
    expect(normalizeOptimizeOptions()).toEqual({
      width: undefined,
      quality: 75,
      format: 'webp',
      source: undefined,
    })
  })

  it('preserves explicitly provided options', () => {
    expect(
      normalizeOptimizeOptions({
        width: 200,
        quality: 90,
        format: 'avif',
        source: 'myanimelist',
      })
    ).toEqual({
      width: 200,
      quality: 90,
      format: 'avif',
      source: 'myanimelist',
    })
  })
})
