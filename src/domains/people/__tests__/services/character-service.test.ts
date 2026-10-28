import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@config/env', () => ({
  env: { NODE_ENV: 'test', LOG_LEVEL: 'silent' },
}))
vi.mock('@lib/cache', () => ({
  cacheGet: vi.fn(),
  cacheSet: vi.fn(),
  withStaleCache: async (opts: { compute: () => Promise<unknown> }) => ({
    value: await opts.compute(),
    isStale: false,
  }),
}))
vi.mock('@media/mappers/media-url', () => ({
  buildMediaUrl: ({
    entity,
    entity_id,
  }: {
    entity: string
    entity_id: number
  }) => `https://cdn.test/${entity}/${entity_id}`,
}))

const m = vi.hoisted(() => ({
  search: vi.fn(),
  count: vi.fn(),
  getCharacter: vi.fn(),
  getVoiceActors: vi.fn(),
  getAppearances: vi.fn(),
  countAppearances: vi.fn(),
}))
vi.mock('@people/repositories/character-search', () => ({
  characterSearchRepository: { search: m.search, count: m.count },
}))
vi.mock('@people/repositories/character-profile', () => ({
  characterProfileRepository: {
    getCharacter: m.getCharacter,
    getVoiceActors: m.getVoiceActors,
  },
}))
vi.mock('@people/repositories/character-appearances', () => ({
  characterAppearancesRepository: {
    getAppearances: m.getAppearances,
    count: m.countAppearances,
  },
}))

const { characterService } = await import('@people/services/character')

const row = {
  malId: 7,
  name: 'Guts',
  nameKanji: null,
  favorites: 1,
  about: null,
  gender: null,
  dateOfBirth: null,
  bloodType: null,
  height: null,
  weight: null,
  age: null,
}

beforeEach(() => {
  vi.clearAllMocks()
  m.getCharacter.mockResolvedValue(row)
  m.getVoiceActors.mockResolvedValue([])
})

describe('characterService', () => {
  it('searches and maps cards', async () => {
    m.search.mockResolvedValue([row])
    m.count.mockResolvedValue(1)
    const { value } = await characterService.search({
      query: 'gu',
      page: 1,
      limit: 20,
    })
    expect(value.total).toBe(1)
    expect(value.list[0].imageUrl).toBe('https://cdn.test/character/7')
    expect(m.count).toHaveBeenCalledWith('gu')
  })

  it('throws CHARACTER_NOT_FOUND', async () => {
    m.getCharacter.mockResolvedValue(undefined)
    await expect(characterService.getProfile(9)).rejects.toMatchObject({
      code: 'CHARACTER_NOT_FOUND',
    })
  })

  it('lists appearances after checking the character exists', async () => {
    m.getAppearances.mockResolvedValue([
      { medium: 'anime', malId: 1, title: 'Berserk', role: 'MAIN' },
    ])
    m.countAppearances.mockResolvedValue(1)
    const { value } = await characterService.getAppearances(7, {
      page: 1,
      limit: 20,
    })
    expect(value.list[0].role).toBe('main')
  })

  it('does not list appearances of an unknown character', async () => {
    m.getCharacter.mockResolvedValue(undefined)
    await expect(
      characterService.getAppearances(9, { page: 1, limit: 20 })
    ).rejects.toMatchObject({ code: 'CHARACTER_NOT_FOUND' })
    expect(m.getAppearances).not.toHaveBeenCalled()
  })
})
