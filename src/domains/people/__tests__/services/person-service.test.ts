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
  getPerson: vi.fn(),
  getCounts: vi.fn(),
  getVoices: vi.fn(),
  countVoices: vi.fn(),
  getCredits: vi.fn(),
  countCredits: vi.fn(),
  getArtistIds: vi.fn(),
  getMusicList: vi.fn(),
}))
vi.mock('@people/repositories/person-search', () => ({
  personSearchRepository: { search: m.search, count: m.count },
}))
vi.mock('@people/repositories/person-profile', () => ({
  personProfileRepository: { getPerson: m.getPerson, getCounts: m.getCounts },
}))
vi.mock('@people/repositories/person-voices', () => ({
  personVoicesRepository: { getVoices: m.getVoices, count: m.countVoices },
}))
vi.mock('@people/repositories/person-credits', () => ({
  personCreditsRepository: {
    getCredits: m.getCredits,
    count: m.countCredits,
    getArtistIds: m.getArtistIds,
  },
}))
vi.mock('@music/services/music-list', () => ({
  musicListService: { getMusicList: m.getMusicList },
}))

const { personService } = await import('@people/services/person')

const counts = { voices: 1, animeCredits: 0, mangaCredits: 0, music: 0 }
const page = { page: 1, limit: 20 }

beforeEach(() => {
  vi.clearAllMocks()
  m.getPerson.mockResolvedValue({
    malId: 5,
    name: 'Kanno',
    favorites: null,
    givenName: null,
    familyName: null,
    birthday: null,
    gender: null,
    about: null,
  })
  m.getCounts.mockResolvedValue(counts)
})

describe('personService', () => {
  it('searches and maps cards', async () => {
    m.search.mockResolvedValue([{ malId: 5, name: 'Kanno', favorites: 1 }])
    m.count.mockResolvedValue(1)
    const { value } = await personService.search({ query: 'ka', ...page })
    expect(value.list[0].imageUrl).toBe('https://cdn.test/staff/5')
  })

  it('maps the profile with counts', async () => {
    const { value } = await personService.getProfile(5)
    expect(value.counts).toEqual(counts)
  })

  it('throws PERSON_NOT_FOUND before any list', async () => {
    m.getPerson.mockResolvedValue(undefined)
    await expect(personService.getVoices(9, page)).rejects.toMatchObject({
      code: 'PERSON_NOT_FOUND',
    })
    expect(m.getVoices).not.toHaveBeenCalled()
  })

  it('lists voices with the language filter', async () => {
    m.getVoices.mockResolvedValue([])
    m.countVoices.mockResolvedValue(0)
    await personService.getVoices(5, { ...page, language: 'English' })
    expect(m.countVoices).toHaveBeenCalledWith(5, 'English')
  })

  it('lists credits of a medium', async () => {
    m.getCredits.mockResolvedValue([
      { medium: 'manga', malId: 2, title: 'Monster', positions: ['Story'] },
    ])
    m.countCredits.mockResolvedValue(1)
    const { value } = await personService.getCredits(5, {
      ...page,
      medium: 'manga',
    })
    expect(value.list[0].imageUrl).toBe('https://cdn.test/manga/2')
  })

  it('lists music through the linked artists', async () => {
    m.getArtistIds.mockResolvedValue([3])
    m.getMusicList.mockResolvedValue({
      value: { list: [], total: 0 },
      isStale: false,
    })
    await personService.getMusic(5, page)
    expect(m.getMusicList).toHaveBeenCalledWith(page, { artistIds: [3] })
  })
})
