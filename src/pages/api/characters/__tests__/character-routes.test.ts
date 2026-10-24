/**
 * Route tests for `/api/characters` and its nested routes.
 *
 * @module pages/api/characters/__tests__/character-routes
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
  search: vi.fn(),
  getProfile: vi.fn(),
  getAppearances: vi.fn(),
}))
vi.mock('@people/services/character', () => ({ characterService: m }))

const { GET: searchRoute } = await import('../index')
const { GET: profileRoute } = await import('../[malId]/index')
const { GET: appearancesRoute } = await import('../[malId]/appearances')
const { DomainError } = await import('@shared/errors/app-error')

const call = (
  route: typeof searchRoute,
  path: string,
  params: Record<string, string> = {}
) =>
  route({
    request: new Request(`http://localhost${path}`),
    params,
    locals: {},
  } as never) as Promise<Response>

const image = 'http://localhost:4321/media/character/7'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('GET /api/characters', () => {
  it('searches with defaults and paginates', async () => {
    m.search.mockResolvedValue({
      value: {
        list: [
          {
            malId: 7,
            name: 'Guts',
            nameKanji: null,
            imageUrl: image,
            favorites: 1,
          },
        ],
        total: 21,
      },
      isStale: false,
    })
    const res = await call(searchRoute, '/api/characters?query=gu')
    expect(res.status).toBe(200)
    expect((await res.json()).meta).toMatchObject({ total: 21, hasNext: true })
    expect(m.search).toHaveBeenCalledWith({ query: 'gu', page: 1, limit: 20 })
  })

  it.each(['', '?query=g', '?query=gu&limit=101'])('rejects %s', async (qs) => {
    expect((await call(searchRoute, `/api/characters${qs}`)).status).toBe(400)
  })
})

describe('GET /api/characters/:malId', () => {
  it('answers 404 for an unknown character', async () => {
    m.getProfile.mockRejectedValue(
      new DomainError('CHARACTER_NOT_FOUND', 'Character not found')
    )
    const res = await call(profileRoute, '/api/characters/9', { malId: '9' })
    expect(res.status).toBe(404)
  })

  it('rejects a non-numeric id', async () => {
    const res = await call(profileRoute, '/api/characters/x', { malId: 'x' })
    expect(res.status).toBe(400)
  })
})

describe('GET /api/characters/:malId/appearances', () => {
  it('forwards pagination', async () => {
    m.getAppearances.mockResolvedValue({
      value: { list: [], total: 0 },
      isStale: false,
    })
    const res = await call(
      appearancesRoute,
      '/api/characters/7/appearances?page=2&limit=5',
      { malId: '7' }
    )
    expect(res.status).toBe(200)
    expect(m.getAppearances).toHaveBeenCalledWith(7, { page: 2, limit: 5 })
  })
})
