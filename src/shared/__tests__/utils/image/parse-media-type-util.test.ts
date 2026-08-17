/**
 * Tests for {@link parseMediaPath}.
 *
 * @module shared/__tests__/utils/image/parse-media-type-util
 * @remarks
 * Covers segment-count and id validation (null returns), the type-first / slug-then-type layouts,
 * raw-entity (music/episode) parsing, and the {@link DomainError} thrown for unsupported
 * entity/media types. Follows the repo TDD/unit-test layout.
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

import { DomainError } from '@shared/errors/app-error'
import { ErrorCodes } from '@shared/errors/codes'
import { MediaSize } from '@media/types/media-types'
import { parseMediaPath } from '@utils/image/parse-media-type-util'

describe('parseMediaPath', () => {
  it('returns null for fewer than 3 segments', () => {
    expect(parseMediaPath('anime/123')).toBeNull()
  })

  it('returns null for more than 6 segments', () => {
    expect(parseMediaPath('anime/123/poster/large/2/extra/more')).toBeNull()
  })

  it('ignores leading and trailing slashes when counting segments', () => {
    expect(parseMediaPath('/anime/123/poster/')).toEqual({
      entityId: 123,
      entityType: 'anime',
      mediaType: 'poster',
      mediaSize: MediaSize.DEFAULT,
      mediaId: 1,
      slug: undefined,
    })
  })

  it('returns null when the id is not a positive integer', () => {
    expect(parseMediaPath('anime/0/poster')).toBeNull()
    expect(parseMediaPath('anime/abc/poster')).toBeNull()
    expect(parseMediaPath('anime/-5/poster')).toBeNull()
  })

  it('throws a DomainError for an unsupported entity', () => {
    try {
      parseMediaPath('user/123/poster')
      expect.unreachable('should have thrown')
    } catch (error) {
      expect(error).toBeInstanceOf(DomainError)
      expect((error as DomainError).code).toBe(ErrorCodes.INVALID_IMAGE_PATH)
    }
  })

  it('throws a DomainError for an unsupported media type on a normal entity', () => {
    expect(() => parseMediaPath('anime/123/screenshot')).toThrow(DomainError)
  })

  it('parses the type-first layout with size and index', () => {
    expect(parseMediaPath('anime/123/poster/small/2')).toEqual({
      entityId: 123,
      entityType: 'anime',
      mediaType: 'poster',
      mediaSize: MediaSize.SMALL,
      mediaId: 2,
      slug: undefined,
    })
  })

  it('parses the slug-then-type layout', () => {
    expect(parseMediaPath('anime/123/naruto/banner/large/3')).toEqual({
      entityId: 123,
      entityType: 'anime',
      mediaType: 'banner',
      mediaSize: MediaSize.LARGE,
      mediaId: 3,
      slug: 'naruto',
    })
  })

  it('parses a raw entity (music) with version and resolution', () => {
    expect(parseMediaPath('music/123/opening/v2/1080p')).toEqual({
      entityId: 123,
      entityType: 'music',
      mediaType: 'opening',
      mediaSize: MediaSize.DEFAULT,
      mediaId: 1,
      version: 'v2',
      resolution: '1080p',
    })
  })

  it('accepts free-text media types for raw entities', () => {
    expect(parseMediaPath('episode/123/thumbnail')).toEqual({
      entityId: 123,
      entityType: 'episode',
      mediaType: 'thumbnail',
      mediaSize: MediaSize.DEFAULT,
      mediaId: 1,
      version: undefined,
      resolution: undefined,
    })
  })
})
