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

const m = vi.hoisted(() => ({
  getProducers: vi.fn(),
  countProducers: vi.fn(),
  getProducer: vi.fn(),
  getTitles: vi.fn(),
  getCreditCounts: vi.fn(),
  getAnimeList: vi.fn(),
  getMangaList: vi.fn(),
}))
vi.mock('@producer/repositories/producer-list', () => ({
  producerListRepository: {
    getProducers: m.getProducers,
    countProducers: m.countProducers,
  },
}))
vi.mock('@producer/repositories/producer-details', () => ({
  producerDetailsRepository: {
    getProducer: m.getProducer,
    getTitles: m.getTitles,
    getCreditCounts: m.getCreditCounts,
  },
}))
vi.mock('@anime/services/anime-list', () => ({
  animeListService: { getAnimeList: m.getAnimeList },
}))
vi.mock('@manga/services/manga-service', () => ({
  mangaListService: { getMangaList: m.getMangaList },
}))

const { producerListService, producerDetailsService, producerWorksService } =
  await import('@producer/services')

const page = { value: { list: [], total: 0 }, isStale: false }

beforeEach(() => {
  vi.clearAllMocks()
  m.getProducer.mockResolvedValue({ malId: 4, established: null, about: null })
  m.getTitles.mockResolvedValue([{ title: 'Bones', type: 'Default' }])
  m.getCreditCounts.mockResolvedValue([])
  m.getAnimeList.mockResolvedValue(page)
  m.getMangaList.mockResolvedValue(page)
})

describe('producerListService', () => {
  it('maps rows and returns the total', async () => {
    m.getProducers.mockResolvedValue([{ malId: 1, name: null, works: 0 }])
    m.countProducers.mockResolvedValue(1)
    const { value } = await producerListService.getProducers({
      page: 1,
      limit: 20,
      sort: 'works',
    })
    expect(value).toEqual({
      list: [{ malId: 1, name: 'Producer 1', works: 0 }],
      total: 1,
    })
  })
})

describe('producerDetailsService', () => {
  it('maps the producer', async () => {
    const { value } = await producerDetailsService.getProducerDetails(4)
    expect(value.name).toBe('Bones')
  })

  it('throws PRODUCER_NOT_FOUND', async () => {
    m.getProducer.mockResolvedValue(undefined)
    await expect(
      producerDetailsService.getProducerDetails(9)
    ).rejects.toMatchObject({ code: 'PRODUCER_NOT_FOUND' })
  })
})

describe('producerWorksService', () => {
  it('lists anime through the producer filter', async () => {
    await producerWorksService.getAnime(4, {
      page: 1,
      limit: 20,
      role: 'studio',
    })
    expect(m.getAnimeList).toHaveBeenCalledWith({
      page: 1,
      limit: 20,
      producer: '4',
      producerRole: 'studio',
    })
  })

  it('lists manga through the producer scope', async () => {
    await producerWorksService.getManga(4, { page: 2, limit: 5 })
    expect(m.getMangaList).toHaveBeenCalledWith(
      { page: 2, limit: 5 },
      { producerId: 4 }
    )
  })

  it('rejects an unknown producer before listing', async () => {
    m.getProducer.mockResolvedValue(undefined)
    await expect(
      producerWorksService.getAnime(9, { page: 1, limit: 20 })
    ).rejects.toMatchObject({ code: 'PRODUCER_NOT_FOUND' })
    expect(m.getAnimeList).not.toHaveBeenCalled()
  })
})
