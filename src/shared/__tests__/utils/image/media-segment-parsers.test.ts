/**
 * Tests for the semantic media segment parsers.
 *
 * @module shared/__tests__/utils/image/media-segment-parsers
 * @remarks
 * Covers the type-first, slug-then-type, and raw-entity layouts including size/index resolution
 * and index defaulting/validation. Follows the repo TDD/unit-test layout.
 */
import { describe, expect, it, vi } from 'vitest'

vi.mock('@media/config', () => ({
  mediaServiceConfig: {
    defaultQuality: 75,
    defaultFormat: 'webp',
    defaultPlaceholderUrl: 'http://localhost/placeholder.webp',
    supportedMediaTypes: [
      'poster',
      'banner',
      'background',
      'clearart',
      'clearlogo',
      'icon',
    ],
    supportedEntities: [
      'anime',
      'character',
      'staff',
      'studio',
      'episode',
      'music',
    ],
  },
}))

import { MediaSize } from '@media/types/media-types'
import {
  parseRawEntityPattern,
  parseSlugThenTypePattern,
  parseTypeFirstPattern,
} from '@utils/image/media-segment-parsers'

describe('parseTypeFirstPattern', () => {
  it('returns null when the media type is invalid for the entity', () => {
    expect(
      parseTypeFirstPattern('unknown', undefined, undefined, 'anime')
    ).toBeNull()
  })

  it('parses type only, defaulting size and index', () => {
    expect(
      parseTypeFirstPattern('poster', undefined, undefined, 'anime')
    ).toEqual({ type: 'poster', size: MediaSize.DEFAULT, index: 1 })
  })

  it('parses type with size and index', () => {
    expect(parseTypeFirstPattern('poster', 'large', '3', 'anime')).toEqual({
      type: 'poster',
      size: MediaSize.LARGE,
      index: 3,
    })
  })

  it('treats a non-size fourth segment as the index', () => {
    expect(parseTypeFirstPattern('poster', '2', undefined, 'anime')).toEqual({
      type: 'poster',
      size: MediaSize.DEFAULT,
      index: 2,
    })
  })

  it('falls back to index 1 for non-positive or non-integer index', () => {
    expect(parseTypeFirstPattern('poster', 'small', '0', 'anime')).toEqual({
      type: 'poster',
      size: MediaSize.SMALL,
      index: 1,
    })
    expect(parseTypeFirstPattern('poster', 'small', 'x', 'anime')).toEqual({
      type: 'poster',
      size: MediaSize.SMALL,
      index: 1,
    })
  })
})

describe('parseSlugThenTypePattern', () => {
  it('returns null when the slug segment is missing', () => {
    expect(
      parseSlugThenTypePattern(
        undefined,
        'poster',
        undefined,
        undefined,
        'anime'
      )
    ).toBeNull()
  })

  it('returns null when the media type is invalid', () => {
    expect(
      parseSlugThenTypePattern(
        'naruto',
        'unknown',
        undefined,
        undefined,
        'anime'
      )
    ).toBeNull()
  })

  it('parses slug, type, size, and index', () => {
    expect(
      parseSlugThenTypePattern('naruto', 'banner', 'small', '4', 'anime')
    ).toEqual({
      type: 'banner',
      size: MediaSize.SMALL,
      index: 4,
      slug: 'naruto',
    })
  })
})

describe('parseRawEntityPattern', () => {
  it('returns null when the media type is missing', () => {
    expect(parseRawEntityPattern(undefined, undefined, undefined)).toBeNull()
  })

  it('parses free-text type with version and resolution', () => {
    expect(parseRawEntityPattern('opening', 'v2', '1080p')).toEqual({
      type: 'opening',
      size: MediaSize.DEFAULT,
      index: 1,
      version: 'v2',
      resolution: '1080p',
    })
  })
})
