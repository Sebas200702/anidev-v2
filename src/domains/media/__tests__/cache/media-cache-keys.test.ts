/**
 * Tests for the media-cache key builders.
 *
 * @module domains/media/__tests__/cache/media-cache-keys
 * @remarks
 * Covers URL vs semantic-path key layouts with option defaults and raw/meta
 * keys. All functions are pure. Follows the repo TDD/unit-test layout.
 */
import { describe, expect, it } from 'vitest'
import { MediaEntity, MediaSize, MediaType } from '@media/types'
import {
  buildKey,
  buildRawKey,
  buildRawMetaKey,
} from '@media/cache/media-cache/keys'

const path = {
  entityType: MediaEntity.ANIME,
  entityId: 5114,
  mediaType: MediaType.POSTER,
  mediaSize: MediaSize.LARGE,
  mediaId: 2,
}

describe('buildKey', () => {
  it('builds a URL key with option defaults', () => {
    expect(buildKey('https://cdn/x.jpg', {})).toBe(
      'optimized:url:https://cdn/x.jpg:wauto:qauto:fwebp:s'
    )
  })

  it('builds a URL key with explicit options', () => {
    expect(
      buildKey('https://cdn/x.jpg', {
        width: 400,
        quality: 80,
        format: 'avif',
        source: 'myanimelist',
      })
    ).toBe('optimized:url:https://cdn/x.jpg:w400:q80:favif:smyanimelist')
  })

  it('builds a semantic-path key', () => {
    expect(buildKey(path, { width: 300 })).toBe(
      'optimized:anime:5114:poster:large:2:w300:qauto:fwebp:s'
    )
  })
})

describe('buildRawKey / buildRawMetaKey', () => {
  it('builds raw and meta keys, defaulting mediaId to 1', () => {
    const noId = { ...path, mediaId: undefined }
    expect(buildRawKey(noId)).toBe(
      'raw:anime:5114:poster:large:1:vdefault:rdefault'
    )
    expect(buildRawMetaKey(noId)).toBe(
      'meta:anime:5114:poster:large:1:vdefault:rdefault'
    )
  })

  it('includes version and resolution in raw and meta keys', () => {
    const versioned = { ...path, version: '2', resolution: '1080' }
    expect(buildRawKey(versioned)).toBe(
      'raw:anime:5114:poster:large:2:v2:r1080'
    )
    expect(buildRawMetaKey(versioned)).toBe(
      'meta:anime:5114:poster:large:2:v2:r1080'
    )
  })
})
