import { describe, expect, it, vi } from 'vitest'

vi.mock('@media/mappers/media-url', () => ({
  buildMediaUrl: ({
    entity,
    entity_id,
  }: {
    entity: string
    entity_id: number
  }) => `https://cdn.test/${entity}/${entity_id}`,
}))

const {
  mapCharacterAppearance,
  mapCharacterProfile,
  mapPersonCredit,
  mapPersonProfile,
  mapPersonVoice,
  normalizeCastRole,
} = await import('@people/mappers')

describe('normalizeCastRole', () => {
  it.each([
    ['MAIN', 'main'],
    ['Main', 'main'],
    [' Supporting ', 'supporting'],
    ['BACKGROUND', 'background'],
    ['Cameo', 'supporting'],
    [null, 'supporting'],
  ])('%s → %s', (raw, expected) => {
    expect(normalizeCastRole(raw)).toBe(expected)
  })
})

describe('character mappers', () => {
  const row = {
    malId: 417,
    name: 'Lelouch Lamperouge',
    nameKanji: 'ルルーシュ',
    favorites: 100,
    about: null,
    gender: 'Male',
    dateOfBirth: new Date('2000-12-05T00:00:00Z'),
    bloodType: 'A',
    height: 178,
    weight: null,
    age: '17',
  }

  it('groups voice actors by language in input order', () => {
    const profile = mapCharacterProfile(row, [
      { language: 'Japanese', staffId: 1, name: 'Fukuyama' },
      { language: 'English', staffId: 2, name: 'Green' },
      { language: 'English', staffId: 3, name: 'Other' },
    ])
    expect(profile.dateOfBirth).toBe('2000-12-05')
    expect(profile.imageUrl).toBe('https://cdn.test/character/417')
    expect(
      profile.voiceActors.map((g) => [g.language, g.actors.length])
    ).toEqual([
      ['Japanese', 1],
      ['English', 2],
    ])
  })

  it('normalizes the appearance role and picks the medium image', () => {
    expect(
      mapCharacterAppearance({
        medium: 'manga',
        malId: 9,
        title: 'X',
        role: 'MAIN',
      })
    ).toEqual({
      medium: 'manga',
      malId: 9,
      title: 'X',
      role: 'main',
      imageUrl: 'https://cdn.test/manga/9',
    })
  })
})

describe('person mappers', () => {
  it('maps the profile with its counts', () => {
    const counts = { voices: 3, animeCredits: 1, mangaCredits: 0, music: 2 }
    const profile = mapPersonProfile(
      {
        malId: 5,
        name: 'Kanno',
        favorites: null,
        givenName: 'Yoko',
        familyName: 'Kanno',
        birthday: null,
        gender: null,
        about: null,
      },
      counts
    )
    expect(profile.counts).toEqual(counts)
    expect(profile.imageUrl).toBe('https://cdn.test/staff/5')
  })

  it('maps a voice with no anime to an empty list', () => {
    const voice = mapPersonVoice({
      characterId: 7,
      characterName: 'Guts',
      language: 'Japanese',
      anime: null,
    })
    expect(voice.anime).toEqual([])
    expect(voice.character.imageUrl).toBe('https://cdn.test/character/7')
  })

  it('maps a credit with every position', () => {
    expect(
      mapPersonCredit({
        medium: 'anime',
        malId: 1,
        title: 'Bebop',
        positions: ['Director', 'Storyboard'],
      }).positions
    ).toEqual(['Director', 'Storyboard'])
  })
})
