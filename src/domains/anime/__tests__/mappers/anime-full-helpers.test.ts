/**
 * Tests for the full-anime mapper helpers.
 *
 * @module domains/anime/__tests__/mappers/anime-full-helpers
 * @remarks
 * Covers ordered title assembly (main → synonyms → english/japanese) and relation grouping by
 * type with title resolution from related rows. `@/config` is mocked. Follows the repo
 * TDD/unit-test layout.
 */
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/config', () => ({
  config: { baseUrl: 'https://anidev.test' },
}))

import {
  buildAnimeTitles,
  groupAnimeRelations,
} from '@anime/mappers/anime-full/helpers'
import type {
  AnimeDB,
  AnimeRelationsDB,
  AnimeTitleSynonymDB,
} from '@anime/types'

const anime = (over: Partial<AnimeDB>): AnimeDB =>
  ({
    malId: 1,
    title: 'Naruto',
    titleEnglish: null,
    titleJapanese: null,
    ...over,
  }) as AnimeDB

const synonym = (title: string): AnimeTitleSynonymDB =>
  ({ animeId: 1, title }) as AnimeTitleSynonymDB

describe('buildAnimeTitles', () => {
  it('returns just the main title when nothing else is set', () => {
    expect(buildAnimeTitles(anime({}), [])).toEqual([
      { title: 'Naruto', type: 'main' },
    ])
  })

  it('appends synonyms then english and japanese in order', () => {
    const titles = buildAnimeTitles(
      anime({ titleEnglish: 'Naruto EN', titleJapanese: 'ナルト' }),
      [synonym('NRT')]
    )
    expect(titles).toEqual([
      { title: 'Naruto', type: 'main' },
      { title: 'NRT', type: 'synonym' },
      { title: 'Naruto EN', type: 'english' },
      { title: 'ナルト', type: 'japanese' },
    ])
  })
})

const relation = (over: Partial<AnimeRelationsDB>): AnimeRelationsDB =>
  ({
    animeId: 1,
    relatedAnimeId: 2,
    relationType: 'Sequel',
    ...over,
  }) as AnimeRelationsDB

describe('groupAnimeRelations', () => {
  it('groups relations by type and resolves related titles', () => {
    const groups = groupAnimeRelations(
      [
        relation({ relatedAnimeId: 2, relationType: 'Sequel' }),
        relation({ relatedAnimeId: 3, relationType: 'Sequel' }),
      ],
      [anime({ malId: 2, title: 'Shippuden' })]
    )
    expect(groups).toEqual([
      {
        relation: 'Sequel',
        entry: [
          {
            relatedId: 2,
            title: 'Shippuden',
            url: 'https://anidev.test/anime/2',
          },
          { relatedId: 3, title: '', url: 'https://anidev.test/anime/3' },
        ],
      },
    ])
  })

  it('returns an empty array when there are no relations', () => {
    expect(groupAnimeRelations([], [])).toEqual([])
  })
})
