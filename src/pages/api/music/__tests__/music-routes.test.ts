/**
 * Route tests for the music endpoints under `/api/music`.
 *
 * @module pages/api/music/__tests__/music-routes
 * @remarks
 * Drives the real request-validation + error-handling wrappers with mocked services and permissive
 * response schemas. Covers the detail route (`[id]`) success + `Number()` coercion and the list
 * route pagination meta (`hasNext`). Follows the repo TDD/unit-test layout.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

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

const { getDetails, getList } = vi.hoisted(() => ({
  getDetails: vi.fn(),
  getList: vi.fn(),
}))

vi.mock('@music/services/music', () => ({
  musicService: { getMusicDetailsById: getDetails },
}))
vi.mock('@music/services/music-list', () => ({
  musicListService: { getMusicList: getList },
}))

vi.mock('@music/schemas/api-schema', async (orig) => ({
  ...(await orig<typeof import('@music/schemas/api-schema')>()),
  musicDetailsResponseSchema: z.any(),
}))
vi.mock('@music/schemas/music-list-schema', async (orig) => ({
  ...(await orig<typeof import('@music/schemas/music-list-schema')>()),
  musicListResponseSchema: z.any(),
}))

const { GET: getDetailRoute } = await import('../[id]')
const { GET: getListRoute } = await import('../index')

type RouteFn = (ctx: unknown) => Promise<Response>

beforeEach(() => {
  vi.clearAllMocks()
})

describe('GET /api/music/[id]', () => {
  it('coerces the id and returns the detail envelope', async () => {
    getDetails.mockResolvedValue({ value: { title: 'X' }, isStale: false })

    const res = await (getDetailRoute as RouteFn)({
      request: new Request('http://localhost:4321/api/music/42'),
      params: { id: '42' },
    })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data).toEqual({ title: 'X' })
    expect(getDetails).toHaveBeenCalledWith(42)
  })
})

describe('GET /api/music', () => {
  it('returns paginated data with hasNext meta', async () => {
    getList.mockResolvedValue({
      value: { list: [{ id: 1 }], total: 25 },
      isStale: false,
    })

    const res = await (getListRoute as RouteFn)({
      request: new Request('http://localhost:4321/api/music?page=1&limit=10'),
      params: {},
    })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data).toEqual([{ id: 1 }])
    expect(body.meta.total).toBe(25)
    expect(body.meta.hasNext).toBe(true)
  })
})
