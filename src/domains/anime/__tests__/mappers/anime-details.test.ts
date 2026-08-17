/**
 * Tests for {@link mapAnimeDetails}.
 *
 * @module domains/anime/__tests__/mappers/anime-details
 * @remarks
 * Covers taxonomy name flattening, poster/banner URL construction, the trailer fallback, and the
 * slug/url/watchUrl derivation. {@link buildMediaUrl} and `@/config` are mocked so the mapper is
 * exercised without loading the env-validated config. Follows the repo TDD/unit-test layout.
 */
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/config', () => ({
  config: { baseUrl: 'https://anidev.test' },
}))
vi.mock('@media/mappers/media-url', () => ({
  buildMediaUrl: ({ type, size }: { type: string; size?: string }) =>
    `url:${type}:${size ?? 'none'}`,
}))

import { mapAnimeDetails } from '@anime/mappers/anime'
import type { AnimeDB } from '@anime/types'
import type { MediaAsset } from '@media/types/media-types'

const named = (name: string) => ({ name }) as never

const baseInput = (over: Partial<AnimeDB> = {}, media: MediaAsset[] = []) => ({
  genres: [named('Action'), named('Comedy')],
  themes: [named('School')],
  demographics: [named('Shounen')],
  media,
  anime: {
    malId: 20,
    title: 'Naruto',
    year: 2002,
    status: 'Finished',
    synopsis: 'A ninja story.',
    ...over,
  } as AnimeDB,
})

describe('mapAnimeDetails', () => {
  it('flattens taxonomy rows to name arrays', () => {
    const d = mapAnimeDetails(baseInput())
    expect(d.genres).toEqual(['Action', 'Comedy'])
    expect(d.themes).toEqual(['School'])
    expect(d.demographics).toEqual(['Shounen'])
  })

  it('builds poster and banner URLs and image alt text', () => {
    const d = mapAnimeDetails(baseInput())
    expect(d.imageUrl).toBe('url:poster:large')
    expect(d.smallImageUrl).toBe('url:poster:small')
    expect(d.bannerImageUrl).toBe('url:banner:none')
    expect(d.altImageText).toBe('Image for Naruto')
  })

  it('derives slug, canonical url, and watch url', () => {
    const d = mapAnimeDetails(baseInput())
    expect(d.slug).toBe('naruto')
    expect(d.url).toBe('https://anidev.test/anime/20/naruto')
    expect(d.watchUrl).toBe('https://anidev.test/anime/20/watch')
  })

  it('applies defaults for missing year, status, and synopsis', () => {
    const d = mapAnimeDetails(
      baseInput({ year: null, status: null, synopsis: null })
    )
    expect(d.year).toBe(0)
    expect(d.status).toBe('Unknown')
    expect(d.synopsis).toBe('No synopsis available.')
  })

  it('uses the trailer asset src when present', () => {
    const d = mapAnimeDetails(
      baseInput({}, [{ mediaType: 'trailer', src: 'https://yt/x' } as never])
    )
    expect(d.trailerUrl).toBe('https://yt/x')
  })

  it('falls back to the placeholder when no trailer asset exists', () => {
    const d = mapAnimeDetails(baseInput())
    expect(d.trailerUrl).toBe('https://anidev.test/placeholder.webp')
  })
})
