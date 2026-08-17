/**
 * Test for the {@link mediaService} aggregator surface.
 *
 * @module domains/media/__tests__/services/media-service-aggregator
 * @remarks
 * The composed functions are mocked; this asserts the public method surface is wired (including the
 * documented aliases). Follows the repo TDD/unit-test layout.
 */
import { describe, expect, it, vi } from 'vitest'

vi.mock('@utils/image/parse-media-type-util', () => ({
  parseMediaPath: vi.fn(),
}))
vi.mock('@media/services/resolve-media', () => ({ resolveMedia: vi.fn() }))
vi.mock('@media/services/fetch-image-buffer', () => ({
  fetchImageBuffer: vi.fn(),
}))
vi.mock('@media/services/optimize-media', () => ({ optimizeMedia: vi.fn() }))
vi.mock('@media/services/optimize-media-url', () => ({
  optimizeMediaByUrl: vi.fn(),
}))
vi.mock('@media/services/fetch-raw-media', () => ({ fetchRawMedia: vi.fn() }))

const { mediaService } = await import('@media/services/media')

describe('mediaService', () => {
  it('exposes the full method surface including aliases', () => {
    for (const method of [
      'parsePath',
      'resolveMedia',
      'getEntityMedia',
      'optimizeMedia',
      'optimizeEntityMedia',
      'fetchRawMedia',
      'optimizeMediaByUrl',
      'optimizeAndCacheImage',
      'fetchImageBuffer',
    ]) {
      expect(mediaService[method as keyof typeof mediaService]).toBeTypeOf(
        'function'
      )
    }
  })
})
