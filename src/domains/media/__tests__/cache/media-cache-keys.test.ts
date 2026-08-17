/**
 * Tests for the media-cache key builders and image (de)serialization.
 *
 * @module domains/media/__tests__/cache/media-cache-keys
 * @remarks
 * Covers URL vs semantic-path key layouts with option defaults, raw/meta keys, and the
 * base64 round-trip plus null/malformed handling of {@link deserializeImage}. All functions are
 * pure. Follows the repo TDD/unit-test layout.
 */
import { describe, expect, it } from 'vitest'
import { MediaEntity, MediaSize, MediaType } from '@media/types'
import {
  buildKey,
  buildRawKey,
  buildRawMetaKey,
} from '@media/cache/media-cache/keys'
import {
  deserializeImage,
  serializeImage,
} from '@media/cache/media-cache/serialization'

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
    expect(buildRawKey(noId)).toBe('raw:anime:5114:poster:large:1')
    expect(buildRawMetaKey(noId)).toBe('meta:anime:5114:poster:large:1')
  })
})

describe('serializeImage / deserializeImage', () => {
  it('round-trips an image through base64', () => {
    const image = { buffer: Buffer.from('hello'), mimeType: 'image/webp' }
    const serialized = serializeImage(image)
    expect(serialized.buffer).toBe(Buffer.from('hello').toString('base64'))

    const restored = deserializeImage(serialized)
    expect(restored?.mimeType).toBe('image/webp')
    expect(restored?.buffer.toString()).toBe('hello')
  })

  it('parses a JSON string payload', () => {
    const json = JSON.stringify({
      buffer: Buffer.from('hi').toString('base64'),
      mimeType: 'image/png',
    })
    expect(deserializeImage(json)?.buffer.toString()).toBe('hi')
  })

  it('returns null for null, malformed JSON, or incomplete payloads', () => {
    expect(deserializeImage(null)).toBeNull()
    expect(deserializeImage('{not json')).toBeNull()
    expect(deserializeImage({ buffer: '', mimeType: '' })).toBeNull()
  })
})
