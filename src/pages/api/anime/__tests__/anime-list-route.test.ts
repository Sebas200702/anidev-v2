/**
 * Route tests for `GET /api/anime` after adopting the response-schema wrapper.
 *
 * @module pages/api/anime/__tests__/anime-list-route
 * @remarks
 * Verifies the migrated route returns a 200 success envelope and that malformed
 * handler output is rejected as 500 `RESPONSE_VALIDATION_ERROR` by the wrapper.
 */
import { describe, expect, it, vi } from 'vitest'

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

const call = (url = 'http://localhost:4321/api/anime?page=1&limit=10') =>
  (GET as unknown as (ctx: unknown) => Promise<Response>)({
    request: new Request(url),
    locals: {},
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
