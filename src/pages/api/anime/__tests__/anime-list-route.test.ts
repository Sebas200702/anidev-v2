/**
 * Route tests for `GET /api/anime` after adopting the response-schema wrapper
 * and best-effort search-history recording.
 *
 * @module pages/api/anime/__tests__/anime-list-route
 * @remarks
 * Verifies the migrated route returns a 200 success envelope, rejects malformed
 * handler output as 500 `RESPONSE_VALIDATION_ERROR`, and records history only
 * for authenticated callers who issue a real search (not plain pagination).
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

const { getAnimeListMock } = vi.hoisted(() => ({ getAnimeListMock: vi.fn() }))
vi.mock('@anime/services/anime-list', () => ({
  animeListService: { getAnimeList: getAnimeListMock },
}))

const { recordMock } = vi.hoisted(() => ({ recordMock: vi.fn() }))
vi.mock('@search/services/search-history', () => ({
  searchHistoryService: { record: recordMock },
}))

const { GET } = await import('../index')

const validCard = {
  malId: 1,
  title: 'Cowboy Bebop',
  year: 1998,
  status: 'Finished Airing',
  score: 8.75,
  type: 'TV',
  imageUrl: 'https://cdn.example.com/1.webp',
  smallImageUrl: 'https://cdn.example.com/1t.webp',
  altImageText: 'Cowboy Bebop',
}

const call = (
  url = 'http://localhost:4321/api/anime?page=1&limit=10',
  locals: Record<string, unknown> = {}
) =>
  (GET as unknown as (ctx: unknown) => Promise<Response>)({
    request: new Request(url),
    locals,
  })

beforeEach(() => {
  getAnimeListMock.mockReset()
  recordMock.mockReset()
  recordMock.mockResolvedValue(undefined)
})

describe('GET /api/anime — response wrapper', () => {
  it('returns a 200 success envelope with pagination meta', async () => {
    getAnimeListMock.mockResolvedValueOnce({
      value: { list: [validCard], total: 1 },
      isStale: false,
    })

    const res = await call()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data).toEqual([validCard])
    expect(body.meta.page).toBe(1)
    expect(body.meta.hasNext).toBe(false)
  })

  it('returns 500 RESPONSE_VALIDATION_ERROR when a card is malformed', async () => {
    getAnimeListMock.mockResolvedValueOnce({
      value: { list: [{ ...validCard, imageUrl: 'not-a-url' }], total: 1 },
      isStale: false,
    })

    const res = await call()
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.code).toBe('RESPONSE_VALIDATION_ERROR')
    expect(body.data).toBeNull()
  })
})

describe('GET /api/anime — search-history recording', () => {
  beforeEach(() => {
    getAnimeListMock.mockResolvedValue({
      value: { list: [validCard], total: 1 },
      isStale: false,
    })
  })

  it('records a scoped entry when authenticated and a query is present', async () => {
    const res = await call(
      'http://localhost:4321/api/anime?page=1&limit=10&query=bebop',
      { user: { id: 'user-1' } }
    )

    expect(res.status).toBe(200)
    expect(recordMock).toHaveBeenCalledTimes(1)
    expect(recordMock).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        scope: 'anime',
        query: 'bebop',
      })
    )
    // pagination must not leak into the persisted filters snapshot
    expect(recordMock.mock.calls[0][0].filters).not.toHaveProperty('page')
    expect(recordMock.mock.calls[0][0].filters).not.toHaveProperty('limit')
  })

  it('does not record for anonymous callers', async () => {
    const res = await call(
      'http://localhost:4321/api/anime?page=1&limit=10&query=bebop',
      {}
    )

    expect(res.status).toBe(200)
    expect(recordMock).not.toHaveBeenCalled()
  })

  it('does not record plain pagination (no search intent)', async () => {
    const res = await call('http://localhost:4321/api/anime?page=1&limit=10', {
      user: { id: 'user-1' },
    })

    expect(res.status).toBe(200)
    expect(recordMock).not.toHaveBeenCalled()
  })
})
