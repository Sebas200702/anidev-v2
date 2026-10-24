/**
 * Route tests for `/api/producers` and its nested routes.
 *
 * @module pages/api/producers/__tests__/producer-routes
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@config/env', () => ({
  env: {
    NODE_ENV: 'test',
    DATABASE_URL: 'postgres://test:test@localhost:5432/test',
    REDIS_URL: 'redis://localhost:6379',
    APP_BASE_URL: 'http://localhost:4321',
    BETTER_AUTH_SECRET: 'test-secret-test-secret-test-secret-test-secret',
    LOG_LEVEL: 'silent',
  },
}))

const m = vi.hoisted(() => ({
  getProducers: vi.fn(),
  getProducerDetails: vi.fn(),
  getAnime: vi.fn(),
  getManga: vi.fn(),
}))
vi.mock('@producer/services/producer-list', () => ({
  producerListService: { getProducers: m.getProducers },
}))
vi.mock('@producer/services/producer-details', () => ({
  producerDetailsService: { getProducerDetails: m.getProducerDetails },
}))
vi.mock('@producer/services/producer-works', () => ({
  producerWorksService: { getAnime: m.getAnime, getManga: m.getManga },
}))

const { GET: listRoute } = await import('../index')
const { GET: detailRoute } = await import('../[malId]/index')
const { GET: animeRoute } = await import('../[malId]/anime')
const { GET: mangaRoute } = await import('../[malId]/manga')
const { DomainError } = await import('@shared/errors/app-error')

const call = (
  route: typeof listRoute,
  path: string,
  params: Record<string, string> = {}
) =>
  route({
    request: new Request(`http://localhost${path}`),
    params,
    locals: {},
  } as never) as Promise<Response>

const empty = { value: { list: [], total: 0 }, isStale: false }

beforeEach(() => {
  vi.clearAllMocks()
  m.getProducers.mockResolvedValue({
    value: { list: [{ malId: 4, name: 'Bones', works: 3 }], total: 1 },
    isStale: false,
  })
  m.getAnime.mockResolvedValue(empty)
  m.getManga.mockResolvedValue(empty)
})

describe('GET /api/producers', () => {
  it('passes the validated query and paginates', async () => {
    const res = await call(listRoute, '/api/producers?role=studio&sort=name')
    expect(res.status).toBe(200)
    expect((await res.json()).meta).toMatchObject({ total: 1, hasNext: false })
    expect(m.getProducers).toHaveBeenCalledWith({
      page: 1,
      limit: 20,
      role: 'studio',
      sort: 'name',
    })
  })

  it.each(['?role=artist', '?sort=random', '?limit=0'])(
    'rejects %s',
    async (qs) => {
      expect((await call(listRoute, `/api/producers${qs}`)).status).toBe(400)
    }
  )
})

describe('GET /api/producers/:malId', () => {
  it('returns the detail', async () => {
    m.getProducerDetails.mockResolvedValue({
      value: {
        malId: 4,
        name: 'Bones',
        titles: [{ title: 'Bones', type: 'Default' }],
        established: null,
        about: null,
        counts: { studio: 3, producer: 0, licensor: 0, serialization: 0 },
      },
      isStale: false,
    })
    const res = await call(detailRoute, '/api/producers/4', { malId: '4' })
    expect(res.status).toBe(200)
    expect((await res.json()).data.counts.studio).toBe(3)
  })

  it('answers 404 for an unknown producer', async () => {
    m.getProducerDetails.mockRejectedValue(
      new DomainError('PRODUCER_NOT_FOUND', 'Producer not found', { malId: 9 })
    )
    const res = await call(detailRoute, '/api/producers/9', { malId: '9' })
    expect(res.status).toBe(404)
  })

  it('rejects a non-numeric id', async () => {
    const res = await call(detailRoute, '/api/producers/x', { malId: 'x' })
    expect(res.status).toBe(400)
  })
})

describe('GET /api/producers/:malId/anime and /manga', () => {
  it('forwards role and pagination to the works service', async () => {
    const res = await call(animeRoute, '/api/producers/4/anime?role=studio', {
      malId: '4',
    })
    expect(res.status).toBe(200)
    expect(m.getAnime).toHaveBeenCalledWith(4, {
      page: 1,
      limit: 20,
      role: 'studio',
    })
  })

  it('rejects the manga-only role on the anime route', async () => {
    const res = await call(
      animeRoute,
      '/api/producers/4/anime?role=serialization',
      { malId: '4' }
    )
    expect(res.status).toBe(400)
  })

  it('lists manga', async () => {
    const res = await call(mangaRoute, '/api/producers/4/manga?page=2', {
      malId: '4',
    })
    expect(res.status).toBe(200)
    expect(m.getManga).toHaveBeenCalledWith(4, { page: 2, limit: 20 })
  })
})
