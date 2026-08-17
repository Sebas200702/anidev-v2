/**
 * Route tests for the anime detail endpoints under `/api/anime/[malId]`.
 *
 * @module pages/api/anime/__tests__/anime-detail-routes
 * @remarks
 * Drives the real request-validation + error-handling wrappers with mocked services. The response
 * schemas are replaced with a permissive schema (their strictness is already covered by the
 * schema-level and list-route tests) so these focus on wiring: param coercion → service call →
 * success envelope, plus the 400 for a non-numeric `malId`. Follows the repo TDD/unit-test layout.
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

const { getFull, getDetails, getChars, getStaff } = vi.hoisted(() => ({
  getFull: vi.fn(),
  getDetails: vi.fn(),
  getChars: vi.fn(),
  getStaff: vi.fn(),
}))

vi.mock('@anime/services/anime-full', () => ({
  animeFullService: { getAnimeFullByMalId: getFull },
}))
vi.mock('@anime/services/anime', () => ({
  animeService: { getAnimeDetails: getDetails },
}))
vi.mock('@anime/services/anime-characters', () => ({
  animeCharacterService: { getAnimeCharacters: getChars },
}))
vi.mock('@anime/services/anime-staff', () => ({
  animeStaffService: { getAnimeStaff: getStaff },
}))

vi.mock('@anime/schemas/anime-full-schema', async (orig) => ({
  ...(await orig<typeof import('@anime/schemas/anime-full-schema')>()),
  animeFullDetailsResponseSchema: z.any(),
}))
vi.mock('@anime/schemas/anime-details-schema', async (orig) => ({
  ...(await orig<typeof import('@anime/schemas/anime-details-schema')>()),
  animeDetailsResponseSchema: z.any(),
}))
vi.mock('@anime/schemas/anime-character-schema', async (orig) => ({
  ...(await orig<typeof import('@anime/schemas/anime-character-schema')>()),
  animeCharacterResponseSchema: z.any(),
}))
vi.mock('@anime/schemas/anime-staff-schema', async (orig) => ({
  ...(await orig<typeof import('@anime/schemas/anime-staff-schema')>()),
  animeStaffResponseSchema: z.any(),
}))

const { GET: getFullRoute } = await import('../[malId]/full')
const { GET: getIndexRoute } = await import('../[malId]/index')
const { GET: getCharsRoute } = await import('../[malId]/characters')
const { GET: getStaffRoute } = await import('../[malId]/staff')

type RouteFn = (ctx: unknown) => Promise<Response>

const call = (route: unknown, malId: string) =>
  (route as RouteFn)({
    request: new Request(`http://localhost:4321/api/anime/${malId}`),
    params: { malId },
  })

beforeEach(() => {
  vi.clearAllMocks()
})

describe('GET /api/anime/[malId]/full', () => {
  it('returns a 200 envelope with the stale flag', async () => {
    getFull.mockResolvedValue({ value: { malId: 5114 }, isStale: true })

    const res = await call(getFullRoute, '5114')
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data).toEqual({ malId: 5114 })
    expect(body.meta.stale).toBe(true)
    expect(getFull).toHaveBeenCalledWith(5114)
  })

  it('rejects a non-numeric malId with 400', async () => {
    const res = await call(getFullRoute, 'abc')
    expect(res.status).toBe(400)
    expect(getFull).not.toHaveBeenCalled()
  })
})

describe('GET /api/anime/[malId]', () => {
  it('returns the detail envelope', async () => {
    getDetails.mockResolvedValue({ value: { malId: 5114 }, isStale: false })

    const res = await call(getIndexRoute, '5114')
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data).toEqual({ malId: 5114 })
    expect(getDetails).toHaveBeenCalledWith(5114)
  })
})

describe('GET /api/anime/[malId]/characters', () => {
  it('returns the character list envelope', async () => {
    getChars.mockResolvedValue({ value: [{ malId: 1 }], isStale: false })

    const res = await call(getCharsRoute, '5114')
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data).toEqual([{ malId: 1 }])
    expect(getChars).toHaveBeenCalledWith(5114)
  })
})

describe('GET /api/anime/[malId]/staff', () => {
  it('returns the staff list envelope', async () => {
    getStaff.mockResolvedValue({ value: [{ malId: 1 }], isStale: false })

    const res = await call(getStaffRoute, '5114')

    expect(res.status).toBe(200)
    expect(getStaff).toHaveBeenCalledWith(5114)
  })
})
