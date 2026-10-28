/**
 * Route tests for `/api/people` and its nested routes.
 *
 * @module pages/api/people/__tests__/people-routes
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
  getVoices: vi.fn(),
  getCredits: vi.fn(),
  getMusic: vi.fn(),
}))
vi.mock('@people/services/person', () => ({ personService: m }))

const { GET: searchRoute } = await import('../index')
const { GET: profileRoute } = await import('../[malId]/index')
const { GET: voicesRoute } = await import('../[malId]/voices')
const { GET: creditsRoute } = await import('../[malId]/credits')
const { GET: musicRoute } = await import('../[malId]/music')
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

const empty = { value: { list: [], total: 0 }, isStale: false }

beforeEach(() => {
  vi.clearAllMocks()
  for (const fn of [m.search, m.getVoices, m.getCredits, m.getMusic]) {
    fn.mockResolvedValue(empty)
  }
})

describe('GET /api/people', () => {
  it('searches with defaults', async () => {
    const res = await call(searchRoute, '/api/people?query=kanno')
    expect(res.status).toBe(200)
    expect(m.search).toHaveBeenCalledWith({
      query: 'kanno',
      page: 1,
      limit: 20,
    })
  })

  it('rejects a short query', async () => {
    expect((await call(searchRoute, '/api/people?query=k')).status).toBe(400)
  })
})

describe('GET /api/people/:malId', () => {
  it('answers 404 for an unknown person', async () => {
    m.getProfile.mockRejectedValue(
      new DomainError('PERSON_NOT_FOUND', 'Person not found')
    )
    expect(
      (await call(profileRoute, '/api/people/9', { malId: '9' })).status
    ).toBe(404)
  })
})

describe('paginated person lists', () => {
  it('forwards the voice language', async () => {
    const res = await call(
      voicesRoute,
      '/api/people/5/voices?language=English',
      {
        malId: '5',
      }
    )
    expect(res.status).toBe(200)
    expect(m.getVoices).toHaveBeenCalledWith(5, {
      page: 1,
      limit: 20,
      language: 'English',
    })
  })

  it('defaults credits to anime and rejects an unknown medium', async () => {
    await call(creditsRoute, '/api/people/5/credits', { malId: '5' })
    expect(m.getCredits).toHaveBeenCalledWith(5, {
      page: 1,
      limit: 20,
      medium: 'anime',
    })
    const res = await call(creditsRoute, '/api/people/5/credits?medium=music', {
      malId: '5',
    })
    expect(res.status).toBe(400)
  })

  it('lists music with pagination meta', async () => {
    const res = await call(musicRoute, '/api/people/5/music?page=2', {
      malId: '5',
    })
    expect((await res.json()).meta).toMatchObject({ page: 2, hasNext: false })
  })
})
