/**
 * Route tests for `GET`/`DELETE /api/search-history`.
 *
 * @module pages/api/__tests__/search-history-route
 * @remarks
 * Covers the owner-scoped contract: anonymous callers get `401 AUTH_REQUIRED`,
 * authenticated callers read their newest-first list and clear it. The service
 * is mocked — these tests exercise the route composition, not persistence.
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

const { listMock, clearMock } = vi.hoisted(() => ({
  listMock: vi.fn(),
  clearMock: vi.fn(),
}))
vi.mock('@search/services/search-history', () => ({
  searchHistoryService: { list: listMock, clear: clearMock },
}))

const { GET, DELETE } = await import('../search-history')

const authed = { user: { id: 'user-1' } }

const callGet = (
  url = 'http://localhost:4321/api/search-history',
  locals: Record<string, unknown> = {}
) =>
  (GET as unknown as (ctx: unknown) => Promise<Response>)({
    request: new Request(url),
    locals,
  })

const callDelete = (locals: Record<string, unknown> = {}) =>
  (DELETE as unknown as (ctx: unknown) => Promise<Response>)({
    request: new Request('http://localhost:4321/api/search-history', {
      method: 'DELETE',
    }),
    locals,
  })

beforeEach(() => {
  listMock.mockReset()
  clearMock.mockReset()
})

describe('GET /api/search-history', () => {
  it('rejects anonymous callers with 401 AUTH_REQUIRED', async () => {
    const res = await callGet()
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.code).toBe('AUTH_REQUIRED')
    expect(listMock).not.toHaveBeenCalled()
  })

  it('returns the owner list newest-first without leaking userId', async () => {
    listMock.mockResolvedValueOnce([
      {
        id: 2,
        userId: 'user-1',
        scope: 'anime',
        query: 'bebop',
        filters: { genre: 'Action' },
        createdAt: new Date('2026-01-02T00:00:00Z'),
      },
      {
        id: 1,
        userId: 'user-1',
        scope: 'anime',
        query: 'naruto',
        filters: null,
        createdAt: new Date('2026-01-01T00:00:00Z'),
      },
    ])

    const res = await callGet(
      'http://localhost:4321/api/search-history?limit=5',
      authed
    )
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(listMock).toHaveBeenCalledWith('user-1', 5)
    expect(body.data).toHaveLength(2)
    expect(body.data[0].id).toBe(2)
    expect(body.data[0]).not.toHaveProperty('userId')
    expect(res.headers.get('Cache-Control')).toBe('private, no-store')
  })

  it('rejects an out-of-range limit with 400', async () => {
    const res = await callGet(
      'http://localhost:4321/api/search-history?limit=0',
      authed
    )

    expect(res.status).toBe(400)
    expect(listMock).not.toHaveBeenCalled()
  })
})

describe('DELETE /api/search-history', () => {
  it('rejects anonymous callers with 401 AUTH_REQUIRED', async () => {
    const res = await callDelete()
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.code).toBe('AUTH_REQUIRED')
    expect(clearMock).not.toHaveBeenCalled()
  })

  it('clears the owner history and returns the removed count', async () => {
    clearMock.mockResolvedValueOnce(3)

    const res = await callDelete(authed)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(clearMock).toHaveBeenCalledWith('user-1')
    expect(body.data.removed).toBe(3)
  })
})
