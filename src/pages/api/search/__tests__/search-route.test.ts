/**
 * Route tests for `GET /api/search`.
 *
 * @module pages/api/search/__tests__/search-route
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

const { search } = vi.hoisted(() => ({ search: vi.fn() }))
vi.mock('@search/services/catalog-search', () => ({
  catalogSearchService: { search },
}))

const { GET } = await import('../index')

const mangaCard = {
  malId: 2,
  title: 'Berserk',
  type: 'manga',
  year: 1989,
  status: 'Publishing',
  score: 9.4,
  chapters: null,
  imageUrl: 'http://localhost:4321/media/manga/2/cover/large',
  smallImageUrl: 'http://localhost:4321/media/manga/2/cover/small',
  altImageText: 'Berserk',
}

const call = (qs: string) =>
  GET({
    request: new Request(`http://localhost/api/search${qs}`),
    params: {},
    locals: {},
  } as never)

describe('GET /api/search', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    search.mockResolvedValue({
      value: { type: 'manga', list: [mangaCard], total: 1 },
      isStale: false,
    })
  })

  it('searches the requested catalog and tags the meta', async () => {
    const response = await call('?q=berserk&type=manga')

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data[0].malId).toBe(2)
    expect(body.meta).toMatchObject({ type: 'manga', total: 1, hasNext: false })
    expect(search).toHaveBeenCalledWith({
      q: 'berserk',
      type: 'manga',
      page: 1,
      limit: 10,
    })
  })

  it('defaults to the anime catalog', async () => {
    await call('?q=bebop')
    expect(search).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'anime' })
    )
  })

  it.each(['', '?q=', '?q=x&type=novel', '?q=x&page=0'])(
    'rejects invalid input %s',
    async (qs) => {
      const response = await call(qs)
      expect(response.status).toBe(400)
      expect(search).not.toHaveBeenCalled()
    }
  )
})
