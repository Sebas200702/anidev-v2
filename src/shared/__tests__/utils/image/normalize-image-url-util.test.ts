/**
 * Tests for {@link normalizeImageUrl}.
 *
 * @module shared/__tests__/utils/image/normalize-image-url-util
 * @remarks
 * Covers non-string input, whitespace-only strings, and trimming of valid URLs, asserting the
 * configured placeholder fallback. Follows the repo TDD/unit-test layout.
 */
import { describe, expect, it, vi } from 'vitest'

vi.mock('@media/config', () => ({
  mediaServiceConfig: {
    defaultQuality: 75,
    defaultFormat: 'webp',
    defaultPlaceholderUrl: 'http://localhost/placeholder.webp',
    supportedMediaTypes: [],
    supportedEntities: [],
  },
}))

import { mediaServiceConfig } from '@media/config'
import { normalizeImageUrl } from '@utils/image/normalize-image-url-util'

describe('normalizeImageUrl', () => {
  const placeholder = mediaServiceConfig.defaultPlaceholderUrl

  it('returns the placeholder for non-string input', () => {
    expect(normalizeImageUrl(null)).toBe(placeholder)
    expect(normalizeImageUrl(undefined)).toBe(placeholder)
  })

  it('returns the placeholder for whitespace-only strings', () => {
    expect(normalizeImageUrl('   ')).toBe(placeholder)
    expect(normalizeImageUrl('')).toBe(placeholder)
  })

  it('trims and returns valid URLs', () => {
    expect(normalizeImageUrl('  https://cdn.example/img.jpg  ')).toBe(
      'https://cdn.example/img.jpg'
    )
  })
})
