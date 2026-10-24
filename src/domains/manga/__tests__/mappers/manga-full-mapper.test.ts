/**
 * Tests for the printed-media cast and extended (`/full`) mappers.
 *
 * @module domains/manga/__tests__/mappers/manga-full-mapper
 */
import { describe, expect, it, vi } from 'vitest'

vi.mock('@config/env', () => ({
  env: { NODE_ENV: 'test', APP_BASE_URL: 'http://localhost:4321' },
}))
vi.mock('@media/mappers/media-url', () => ({
  buildMediaUrl: ({
    entity,
    entity_id,
  }: {
    entity: string
    entity_id: number
  }) => `http://localhost/media/${entity}/${entity_id}`,
}))

const { mapMangaCast } = await import('@manga/mappers/manga-cast')
const { mapMangaToFullDetails, buildMangaTitles, groupMangaRelations } =
  await import('@manga/mappers/manga-full')

const work = {
  malId: 2,
  title: 'Berserk',
  titleEnglish: 'Berserk EN',
  titleJapanese: null,
  type: 'manga',
} as never

describe('mapMangaCast', () => {
  it('attaches each character its voice actors', () => {
    const cast = mapMangaCast(
      [
        { characterId: 7, name: 'Guts', role: 'Main' },
        { characterId: 8, name: 'Casca', role: 'Main' },
      ],
      [{ characterId: 7, staffId: 9, name: 'Iwanaga', language: 'Japanese' }]
    )
    expect(cast[0].voiceActors).toEqual([
      {
        staffId: 9,
        name: 'Iwanaga',
        language: 'Japanese',
        imageUrl: 'http://localhost/media/staff/9',
      },
    ])
    expect(cast[1].voiceActors).toEqual([])
  })
})

describe('buildMangaTitles', () => {
  it('lists main, english and synonyms, skipping empty titles', () => {
    expect(buildMangaTitles(work, ['Kenpuu Denki'])).toEqual([
      { title: 'Berserk', type: 'main' },
      { title: 'Berserk EN', type: 'english' },
      { title: 'Kenpuu Denki', type: 'synonym' },
    ])
  })
})

describe('groupMangaRelations', () => {
  it('groups related works by relation type', () => {
    const groups = groupMangaRelations([
      { relatedMangaId: 3, title: 'A', relationType: 'Sequel' },
      { relatedMangaId: 4, title: 'B', relationType: 'Sequel' },
      { relatedMangaId: 5, title: 'C', relationType: 'Adaptation' },
    ])
    expect(groups.map((g) => [g.relation, g.entry.length])).toEqual([
      ['Sequel', 2],
      ['Adaptation', 1],
    ])
  })
})

describe('mapMangaToFullDetails', () => {
  it('nests taxonomy with ids and drops the flat related list', () => {
    const full = mapMangaToFullDetails({
      work,
      genres: [{ genreId: 1, name: 'Action' }],
      themes: [{ themeId: 2, name: 'Gore' }],
      demographics: [{ demographicId: 42, name: 'Seinen' }],
      characters: [],
      voiceActors: [],
      staff: [],
      publishers: [],
      related: [],
      externalLinks: [],
      synonyms: [],
    })
    expect(full.genres).toEqual([{ malId: 1, name: 'Action' }])
    expect(full.demographics).toEqual([{ malId: 42, name: 'Seinen' }])
    expect(full).not.toHaveProperty('related')
  })
})
