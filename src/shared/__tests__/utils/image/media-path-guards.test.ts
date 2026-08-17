/**
 * Tests for the media path type guards.
 *
 * @module shared/__tests__/utils/image/media-path-guards
 * @remarks
 * Covers entity, media-type, and size validation against {@link mediaServiceConfig}, plus the
 * free-text media-type rule for `episode`/`music` entities. Follows the repo TDD/unit-test layout.
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

import {
  RAW_ENTITIES,
  isSupportedEntity,
  isSupportedMediaSize,
  isSupportedMediaType,
  isValidMediaType,
} from '@utils/image/media-path-guards'

describe('RAW_ENTITIES', () => {
  it('contains exactly episode and music', () => {
    expect(RAW_ENTITIES.has('episode')).toBe(true)
    expect(RAW_ENTITIES.has('music')).toBe(true)
    expect(RAW_ENTITIES.has('anime')).toBe(false)
  })
})

describe('isSupportedMediaType', () => {
  it('accepts configured media types', () => {
    expect(isSupportedMediaType('poster')).toBe(true)
    expect(isSupportedMediaType('banner')).toBe(true)
    expect(isSupportedMediaType('icon')).toBe(true)
  })

  it('rejects unknown or empty types', () => {
    expect(isSupportedMediaType('screenshot')).toBe(false)
    expect(isSupportedMediaType('')).toBe(false)
  })
})

describe('isSupportedEntity', () => {
  it('accepts configured entities', () => {
    expect(isSupportedEntity('anime')).toBe(true)
    expect(isSupportedEntity('character')).toBe(true)
    expect(isSupportedEntity('music')).toBe(true)
  })

  it('rejects unknown entities', () => {
    expect(isSupportedEntity('user')).toBe(false)
    expect(isSupportedEntity('')).toBe(false)
  })
})

describe('isSupportedMediaSize', () => {
  it('accepts the three size keywords', () => {
    expect(isSupportedMediaSize('default')).toBe(true)
    expect(isSupportedMediaSize('small')).toBe(true)
    expect(isSupportedMediaSize('large')).toBe(true)
  })

  it('rejects unknown sizes', () => {
    expect(isSupportedMediaSize('medium')).toBe(false)
    expect(isSupportedMediaSize('2')).toBe(false)
  })
})

describe('isValidMediaType', () => {
  it('returns false for missing type', () => {
    expect(isValidMediaType(undefined, 'anime')).toBe(false)
    expect(isValidMediaType('', 'anime')).toBe(false)
  })

  it('accepts any non-empty type for episode and music entities', () => {
    expect(isValidMediaType('opening', 'music')).toBe(true)
    expect(isValidMediaType('thumbnail', 'episode')).toBe(true)
  })

  it('requires a supported type for non raw entities', () => {
    expect(isValidMediaType('poster', 'anime')).toBe(true)
    expect(isValidMediaType('opening', 'anime')).toBe(false)
  })
})
