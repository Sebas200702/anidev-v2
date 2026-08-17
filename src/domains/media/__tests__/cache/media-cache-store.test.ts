/**
 * Tests for the media-cache store and the {@link mediaCache} facade.
 *
 * @module domains/media/__tests__/cache/media-cache-store
 * @remarks
 * Covers store-level (de)serialization round-trips, raw-meta JSON handling, and the facade's key
 * building + delegation to the store. `@lib/cache` is mocked; serialization is real. Follows the
 * repo TDD/unit-test layout.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MediaEntity, MediaSize, MediaType } from '@media/types'

vi.mock('@config/env', () => ({
  env: { NODE_ENV: 'test', REDIS_URL: 'redis://localhost:6379' },
}))

const { cacheGet, cacheSet } = vi.hoisted(() => ({
  cacheGet: vi.fn(),
  cacheSet: vi.fn(),
}))
vi.mock('@lib/cache', () => ({ cacheGet, cacheSet }))

const { readCachedMedia, writeCachedMedia, readRawMeta, writeRawMeta } =
  await import('@media/cache/media-cache/store')
const { mediaCache } = await import('@media/cache/media-cache')

const path = {
  entityType: MediaEntity.ANIME,
  entityId: 1,
  mediaType: MediaType.POSTER,
  mediaSize: MediaSize.LARGE,
  mediaId: 1,
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('store: cached media', () => {
  it('serializes to base64 on write', async () => {
    await writeCachedMedia('k', {
      buffer: Buffer.from('hi'),
      mimeType: 'image/webp',
    })
    expect(cacheSet).toHaveBeenCalledWith(
      'k',
      { buffer: Buffer.from('hi').toString('base64'), mimeType: 'image/webp' },
      expect.objectContaining({ ttlSeconds: expect.any(Number) })
    )
  })

  it('deserializes on read', async () => {
    cacheGet.mockResolvedValue({
      buffer: Buffer.from('hi').toString('base64'),
      mimeType: 'image/webp',
    })
    const result = await readCachedMedia('k')
    expect(result?.buffer.toString()).toBe('hi')
    expect(result?.mimeType).toBe('image/webp')
  })
})

describe('store: raw meta', () => {
  it('returns null for missing meta', async () => {
    cacheGet.mockResolvedValue(null)
    expect(await readRawMeta('k')).toBeNull()
  })

  it('parses valid JSON meta', async () => {
    cacheGet.mockResolvedValue(JSON.stringify({ src: 'https://cdn/x.jpg' }))
    expect(await readRawMeta('k')).toEqual({ src: 'https://cdn/x.jpg' })
  })

  it('returns null on malformed JSON', async () => {
    cacheGet.mockResolvedValue('{bad')
    expect(await readRawMeta('k')).toBeNull()
  })

  it('stringifies on write', async () => {
    await writeRawMeta('k', { src: 'https://cdn/x.jpg' })
    expect(cacheSet).toHaveBeenCalledWith(
      'k',
      JSON.stringify({ src: 'https://cdn/x.jpg' }),
      expect.objectContaining({ ttlSeconds: expect.any(Number) })
    )
  })
})

describe('mediaCache facade', () => {
  it('builds distinct keys for path, url, raw, and raw-meta', () => {
    expect(mediaCache.key(path, {})).toContain('optimized:')
    expect(mediaCache.keyFromUrl('https://cdn/x', {})).toContain(
      'optimized:url:'
    )
    expect(mediaCache.rawKey(path)).toContain('raw:')
    expect(mediaCache.rawMetaKey(path)).toContain('meta:')
  })

  it('round-trips optimized media through get/set', async () => {
    await mediaCache.set(
      path,
      {},
      { buffer: Buffer.from('x'), mimeType: 'image/webp' }
    )
    expect(cacheSet).toHaveBeenCalledWith(
      mediaCache.key(path, {}),
      expect.objectContaining({ mimeType: 'image/webp' }),
      expect.anything()
    )

    cacheGet.mockResolvedValue({
      buffer: Buffer.from('x').toString('base64'),
      mimeType: 'image/webp',
    })
    const result = await mediaCache.get(path, {})
    expect(result?.mimeType).toBe('image/webp')
  })

  it('round-trips optimized media by URL through getFromUrl/setFromUrl', async () => {
    await mediaCache.setFromUrl(
      'https://cdn/x',
      {},
      {
        buffer: Buffer.from('u'),
        mimeType: 'image/webp',
      }
    )
    expect(cacheSet).toHaveBeenCalledWith(
      mediaCache.keyFromUrl('https://cdn/x', {}),
      expect.objectContaining({ mimeType: 'image/webp' }),
      expect.anything()
    )

    cacheGet.mockResolvedValue({
      buffer: Buffer.from('u').toString('base64'),
      mimeType: 'image/webp',
    })
    const result = await mediaCache.getFromUrl('https://cdn/x', {})
    expect(result?.mimeType).toBe('image/webp')
  })

  it('round-trips raw media through getRaw/setRaw', async () => {
    await mediaCache.setRaw(path, {
      buffer: Buffer.from('r'),
      mimeType: 'audio/mpeg',
    })
    expect(cacheSet).toHaveBeenCalledWith(
      mediaCache.rawKey(path),
      expect.objectContaining({ mimeType: 'audio/mpeg' }),
      expect.anything()
    )

    cacheGet.mockResolvedValue({
      buffer: Buffer.from('r').toString('base64'),
      mimeType: 'audio/mpeg',
    })
    const result = await mediaCache.getRaw(path)
    expect(result?.mimeType).toBe('audio/mpeg')
  })

  it('delegates raw-meta get/set with the meta key', async () => {
    cacheGet.mockResolvedValue(JSON.stringify({ src: 's' }))
    expect(await mediaCache.getRawMeta(path)).toEqual({ src: 's' })

    await mediaCache.setRawMeta(path, { src: 's' })
    expect(cacheSet).toHaveBeenCalledWith(
      mediaCache.rawMetaKey(path),
      JSON.stringify({ src: 's' }),
      expect.anything()
    )
  })
})
