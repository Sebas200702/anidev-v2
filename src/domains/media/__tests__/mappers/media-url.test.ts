/**
 * Tests for {@link buildMediaUrl}.
 *
 * @module domains/media/__tests__/mappers/media-url
 * @remarks
 * Covers path assembly (type-first and slug layouts), size validation, index selection, and the
 * optional `w`/`q`/`source` query params. `@/config` is mocked so the Zod-validated env is not
 * loaded at import. Follows the repo TDD/unit-test layout.
 */
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/config', () => ({
  config: { baseUrl: 'https://anidev.test' },
}))

import { buildMediaUrl } from '@media/mappers/media-url'

describe('buildMediaUrl', () => {
  it('builds a type-first path with the config origin', () => {
    expect(
      buildMediaUrl({ entity: 'anime', entity_id: 5114, type: 'poster' })
    ).toBe('https://anidev.test/media/anime/5114/poster')
  })

  it('lowercases and trims entity and type segments', () => {
    expect(
      buildMediaUrl({ entity: '  Anime ', entity_id: 1, type: ' POSTER ' })
    ).toBe('https://anidev.test/media/anime/1/poster')
  })

  it('includes a valid size segment', () => {
    expect(
      buildMediaUrl({
        entity: 'anime',
        entity_id: 1,
        type: 'poster',
        size: 'large',
      })
    ).toBe('https://anidev.test/media/anime/1/poster/large')
  })

  it('omits an invalid size', () => {
    expect(
      buildMediaUrl({
        entity: 'anime',
        entity_id: 1,
        type: 'poster',
        // @ts-expect-error deliberately invalid size
        size: 'medium',
      })
    ).toBe('https://anidev.test/media/anime/1/poster')
  })

  it('inserts a slug segment before the type', () => {
    expect(
      buildMediaUrl({
        entity: 'anime',
        entity_id: 5114,
        slug: 'fma',
        type: 'banner',
      })
    ).toBe('https://anidev.test/media/anime/5114/fma/banner')
  })

  it('appends a positive integer index', () => {
    expect(
      buildMediaUrl({
        entity: 'anime',
        entity_id: 1,
        type: 'poster',
        size: 'small',
        index: 3,
      })
    ).toBe('https://anidev.test/media/anime/1/poster/small/3')
  })

  it('drops non-positive or non-integer index values', () => {
    expect(
      buildMediaUrl({ entity: 'anime', entity_id: 1, type: 'poster', index: 0 })
    ).toBe('https://anidev.test/media/anime/1/poster')
    expect(
      buildMediaUrl({
        entity: 'anime',
        entity_id: 1,
        type: 'poster',
        index: 1.5,
      })
    ).toBe('https://anidev.test/media/anime/1/poster')
  })

  it('appends w, q, and source query params', () => {
    expect(
      buildMediaUrl({
        entity: 'anime',
        entity_id: 1,
        type: 'poster',
        width: 400,
        quality: 75,
        source: 'myanimelist',
      })
    ).toBe(
      'https://anidev.test/media/anime/1/poster?w=400&q=75&source=myanimelist'
    )
  })

  it('omits non-positive width and quality', () => {
    expect(
      buildMediaUrl({
        entity: 'anime',
        entity_id: 1,
        type: 'poster',
        width: 0,
        quality: -5,
      })
    ).toBe('https://anidev.test/media/anime/1/poster')
  })
})
