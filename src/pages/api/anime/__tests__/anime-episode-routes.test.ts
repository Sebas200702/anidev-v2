/**
 * Route tests for the episode endpoints under `/api/anime/[malId]/episodes`.
 *
 * @module pages/api/anime/__tests__/anime-episode-routes
 * @remarks
 * Drives the real validation + error-handling wrappers and the real response schemas with a mocked
 * service: param/query coercion → service call → envelope and pagination meta, 400 on bad input,
 * and the 404 codes surfaced from domain errors.
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

const { getEpisodes, getEpisode } = vi.hoisted(() => ({
  getEpisodes: vi.fn(),
  getEpisode: vi.fn(),
}))
vi.mock('@anime/services/anime-episodes', () => ({
  animeEpisodesService: { getEpisodes, getEpisode },
}))

const { GET: listRoute } = await import('../[malId]/episodes/index')
const { GET: detailRoute } = await import('../[malId]/episodes/[number]')
const { animeNotFound, episodeNotFound } = await import('@anime/errors')

type RouteFn = (ctx: unknown) => Promise<Response>

const callList = (malId: string, search = '') =>
  (listRoute as RouteFn)({
    request: new Request(
      `http://localhost:4321/api/anime/${malId}/episodes${search}`
    ),
    params: { malId },
  })

const callDetail = (malId: string, number: string) =>
  (detailRoute as RouteFn)({
    request: new Request(
      `http://localhost:4321/api/anime/${malId}/episodes/${number}`
    ),
    params: { malId, number },
  })

const item = {
  id: 10,
  number: 1,
  title: 'Asteroid Blues',
  duration: '25 min',
  aired: '1998-10-23',
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('GET /api/anime/[malId]/episodes', () => {
  it('returns the page with pagination meta', async () => {
    getEpisodes.mockResolvedValue({
      value: { list: [item], total: 26 },
      isStale: false,
    })

    const res = await callList('1', '?page=2&limit=1')
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(getEpisodes).toHaveBeenCalledWith({ malId: 1, page: 2, limit: 1 })
    expect(body.data).toEqual([item])
    expect(body.meta).toMatchObject({
      stale: false,
      page: 2,
      limit: 1,
      total: 26,
      hasNext: true,
    })
  })

  it('applies default pagination and reports the last page', async () => {
    getEpisodes.mockResolvedValue({
      value: { list: [item], total: 1 },
      isStale: false,
    })

    const body = await (await callList('1')).json()

    expect(getEpisodes).toHaveBeenCalledWith({ malId: 1, page: 1, limit: 24 })
    expect(body.meta.hasNext).toBe(false)
  })

  it('rejects an out-of-range limit with 400', async () => {
    const res = await callList('1', '?limit=101')
    expect(res.status).toBe(400)
    expect(getEpisodes).not.toHaveBeenCalled()
  })

  it('maps a missing anime to 404 ANIME_NOT_FOUND', async () => {
    getEpisodes.mockRejectedValue(animeNotFound(999))

    const res = await callList('999')
    const body = await res.json()

    expect(res.status).toBe(404)
    expect(body.code).toBe('ANIME_NOT_FOUND')
  })
})

describe('GET /api/anime/[malId]/episodes/[number]', () => {
  it('returns the episode detail', async () => {
    getEpisode.mockResolvedValue({
      value: { ...item, synopsis: 'Tijuana.' },
      isStale: true,
    })

    const res = await callDetail('1', '1')
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(getEpisode).toHaveBeenCalledWith(1, 1)
    expect(body.data.synopsis).toBe('Tijuana.')
    expect(body.meta.stale).toBe(true)
  })

  it('rejects a non-integer episode number with 400', async () => {
    const res = await callDetail('1', 'abc')
    expect(res.status).toBe(400)
    expect(getEpisode).not.toHaveBeenCalled()
  })

  it('maps a missing episode to 404 EPISODE_NOT_FOUND', async () => {
    getEpisode.mockRejectedValue(episodeNotFound(1, 99))

    const res = await callDetail('1', '99')
    const body = await res.json()

    expect(res.status).toBe(404)
    expect(body.code).toBe('EPISODE_NOT_FOUND')
  })
})
