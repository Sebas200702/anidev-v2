import { describe, expect, it, vi } from 'vitest'

vi.mock('@media/mappers/media-url', () => ({
  buildMediaUrl: ({ size, type }: { size?: string; type?: string }) =>
    `url:${type ?? 'cover'}:${size ?? 'large'}`,
}))

vi.mock('@config', () => ({
  config: { baseUrl: 'http://localhost' },
}))

import { mapMangaCard, mapMangaDetails } from '@manga/mappers/manga-mapper'
import type { MangaDB } from '@manga/types'

const work = (over: Partial<MangaDB> = {}): MangaDB =>
  ({
    malId: 1,
    title: 'Naruto',
    titleEnglish: 'Naruto',
    titleJapanese: 'ナルト',
    type: 'manga',
    status: 'Finished',
    year: 2002,
    chapters: 10,
    volumes: 2,
    score: 8.1,
    synopsis: 'syn',
    background: 'bg',
    serialization: 'Weekly Shonen Jump',
    countryOfOrigin: 'Japan',
    publishedFrom: new Date('2000-01-01T00:00:00.000Z'),
    publishedTo: new Date('2005-01-01T00:00:00.000Z'),
    ...over,
  }) as MangaDB

describe('mapMangaCard', () => {
  it('maps core fields', () => {
    const card = mapMangaCard(work())
    expect(card.malId).toBe(1)
    expect(card.title).toBe('Naruto')
    expect(card.type).toBe('manga')
    expect(card.status).toBe('Finished')
    expect(card.year).toBe(2002)
    expect(card.score).toBe(8.1)
    expect(card.chapters).toBe(10)
    expect(card.altImageText).toBe('Naruto')
  })

  it('defaults missing status and year', () => {
    const card = mapMangaCard(
      work({ status: null, year: null, score: null, chapters: null })
    )
    expect(card.status).toBe('Unknown')
    expect(card.year).toBe(0)
    expect(card.score).toBeNull()
    expect(card.chapters).toBeNull()
  })
})

describe('mapMangaDetails', () => {
  it('maps detail payload', () => {
    const details = mapMangaDetails({
      work: work(),
      genres: [{ name: 'Action' }],
      themes: [{ name: 'Ninja' }],
      demographics: [{ name: 'Shonen' }],
      characters: [{ characterId: 5, name: 'Naruto Uzumaki', role: 'Main' }],
      staff: [{ staffId: 9, name: 'Kishimoto', role: 'Story & Art' }],
      publishers: [{ producerId: 3, name: 'Shueisha', role: 'publisher' }],
      related: [
        {
          relatedMangaId: 2,
          title: 'Naruto Shippuden',
          relationType: 'Sequel',
        },
      ],
      externalLinks: [
        { site: 'MAL', url: 'https://myanimelist.net/manga/1', type: 'info' },
      ],
    })
    expect(details.malId).toBe(1)
    expect(details.genres).toEqual(['Action'])
    expect(details.themes).toEqual(['Ninja'])
    expect(details.demographics).toEqual(['Shonen'])
    expect(details.characters[0]).toMatchObject({
      characterId: 5,
      name: 'Naruto Uzumaki',
      role: 'Main',
    })
    expect(details.staff[0]).toMatchObject({
      staffId: 9,
      name: 'Kishimoto',
      role: 'Story & Art',
    })
    expect(details.publishers[0]).toMatchObject({
      producerId: 3,
      name: 'Shueisha',
      role: 'publisher',
    })
    expect(details.related[0]).toMatchObject({
      mangaId: 2,
      title: 'Naruto Shippuden',
      relationType: 'Sequel',
    })
    expect(details.externalLinks[0]).toMatchObject({
      site: 'MAL',
      type: 'info',
    })
    expect(details.slug).toBe('naruto')
    expect(details.url).toBe('http://localhost/manga/1/naruto')
  })

  it('falls back synopsis and dates', () => {
    const details = mapMangaDetails({
      work: work({
        synopsis: null,
        background: null,
        publishedFrom: null,
        publishedTo: null,
      }),
      genres: [],
      themes: [],
      demographics: [],
      characters: [],
      staff: [],
      publishers: [],
      related: [],
      externalLinks: [],
    })
    expect(details.synopsis).toBe('No synopsis available.')
    expect(details.background).toBe('')
    expect(details.publishedFrom).toBeNull()
    expect(details.publishedTo).toBeNull()
  })
})
