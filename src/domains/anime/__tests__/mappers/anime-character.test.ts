/**
 * Tests for {@link mapAnimeCharacters}.
 *
 * @module domains/anime/__tests__/mappers/anime-character
 * @remarks
 * Covers character lookup, voice-actor grouping, skipping voice rows with unknown staff, the
 * {@link DomainError} thrown for a missing character, and URL/field defaults. {@link buildMediaUrl}
 * and `@/config` are mocked. Follows the repo TDD/unit-test layout.
 */
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/config', () => ({
  config: { baseUrl: 'https://anidev.test' },
}))
vi.mock('@media/mappers/media-url', () => ({
  buildMediaUrl: ({
    entity,
    entity_id,
  }: {
    entity: string
    entity_id: number
  }) => `img:${entity}:${entity_id}`,
}))

import { mapAnimeCharacters } from '@anime/mappers/anime-character'
import { DomainError } from '@shared/errors/app-error'
import { ErrorCodes } from '@shared/errors/codes'
import type {
  AnimeCharacterDB,
  CharacterDB,
  CharacterVoiceActorDB,
  StaffDB,
} from '@anime/types'

const ref = (over: Partial<AnimeCharacterDB>): AnimeCharacterDB =>
  ({ animeId: 1, characterId: 100, role: 'Main', ...over }) as AnimeCharacterDB

const character = (over: Partial<CharacterDB>): CharacterDB =>
  ({
    malId: 100,
    name: 'Naruto',
    about: 'A ninja.',
    nameKanji: 'ナルト',
    ...over,
  }) as CharacterDB

const staff = (over: Partial<StaffDB>): StaffDB =>
  ({ malId: 500, name: 'Junko Takeuchi', ...over }) as StaffDB

const voice = (over: Partial<CharacterVoiceActorDB>): CharacterVoiceActorDB =>
  ({
    characterId: 100,
    staffId: 500,
    language: 'Japanese',
    ...over,
  }) as CharacterVoiceActorDB

describe('mapAnimeCharacters', () => {
  it('maps a character with fields and image URL', () => {
    const [entry] = mapAnimeCharacters({
      refs: [ref({})],
      characters: [character({})],
      voiceRelations: [],
      staff: [],
    })
    expect(entry).toMatchObject({
      malId: 100,
      name: 'Naruto',
      role: 'Main',
      url: 'https://anidev.test/characters/100',
      imageUrl: 'img:character:100',
      about: 'A ninja.',
      nameKanji: 'ナルト',
      voiceActors: [],
    })
  })

  it('attaches voice actors resolved from staff', () => {
    const [entry] = mapAnimeCharacters({
      refs: [ref({})],
      characters: [character({})],
      voiceRelations: [voice({})],
      staff: [staff({})],
    })
    expect(entry.voiceActors).toEqual([
      {
        person: {
          malId: 500,
          url: 'https://anidev.test/people/500',
          name: 'Junko Takeuchi',
          imageUrl: 'img:staff:500',
        },
        language: 'Japanese',
      },
    ])
  })

  it('skips voice rows whose staff is missing', () => {
    const [entry] = mapAnimeCharacters({
      refs: [ref({})],
      characters: [character({})],
      voiceRelations: [voice({ staffId: 999 })],
      staff: [],
    })
    expect(entry.voiceActors).toEqual([])
  })

  it('defaults about and nameKanji to null', () => {
    const [entry] = mapAnimeCharacters({
      refs: [ref({})],
      characters: [character({ about: null, nameKanji: null })],
      voiceRelations: [],
      staff: [],
    })
    expect(entry.about).toBeNull()
    expect(entry.nameKanji).toBeNull()
  })

  it('throws a DomainError when a referenced character is missing', () => {
    try {
      mapAnimeCharacters({
        refs: [ref({ characterId: 404 })],
        characters: [],
        voiceRelations: [],
        staff: [],
      })
      expect.unreachable('should have thrown')
    } catch (error) {
      expect(error).toBeInstanceOf(DomainError)
      expect((error as DomainError).code).toBe(
        ErrorCodes.ANIME_CHARACTER_NOT_FOUND
      )
    }
  })
})
