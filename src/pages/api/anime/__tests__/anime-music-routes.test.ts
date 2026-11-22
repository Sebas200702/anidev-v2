/**
 * Route tests for the music endpoints under `/api/anime/[malId]/music`.
 *
 * @module pages/api/anime/__tests__/anime-music-routes
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

const { getMusicPage, getMusicItem } = vi.hoisted(() => ({
  getMusicPage: vi.fn(),
  getMusicItem: vi.fn(),
}))
vi.mock('@anime/services/anime-music', () => ({
  animeMusicService: { getMusicPage, getMusicItem },
}))

const { GET: listRoute } = await import('../[malId]/music/index')
const { GET: detailRoute } = await import('../[malId]/music/[musicId]')
const { animeNotFound, animeMusicNotFound } = await import('@anime/errors')

type RouteFn = (ctx: unknown) => Promise<Response>

const callList = (malId: string, search = '') =>
  (listRoute as RouteFn)({
    request: new Request(
      `http://localhost:4321/api/anime/${malId}/music${search}`
    ),
    params: { malId },
  })

const callDetail = (malId: string, musicId: string) =>
  (detailRoute as RouteFn)({
    request: new Request(
      `http://localhost:4321/api/anime/${malId}/music/${musicId}`
    ),
    params: { malId, musicId },
  })

const item = {
  id: 10,
  order: 1,
  title: 'Blue Bird',
  type: 'opening',
  episodes: '1-12',
  url: 'http://localhost:4321/music/10/Blue-Bird',
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('GET /api/anime/[malId]/music', () => {
  it('returns the page with pagination meta and the type filter', async () => {
    getMusicPage.mockResolvedValue({
      value: { list: [item], total: 3 },
      isStale: false,
    })

    const res = await callList('1', '?type=Opening&page=2&limit=1')
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(getMusicPage).toHaveBeenCalledWith({
      malId: 1,
      type: 'opening',
      page: 2,
      limit: 1,
    })
    expect(body.data).toEqual([item])
    expect(body.meta).toMatchObject({
      stale: false,
      page: 2,
      limit: 1,
      total: 3,
      hasNext: true,
    })
  })

  it('applies default pagination without a type filter', async () => {
    getMusicPage.mockResolvedValue({
      value: { list: [], total: 0 },
      isStale: false,
    })

    const res = await callList('1')
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(getMusicPage).toHaveBeenCalledWith({
      malId: 1,
      type: undefined,
      page: 1,
      limit: 24,
    })
    expect(body.data).toEqual([])
    expect(body.meta.hasNext).toBe(false)
  })

  it.each(['?type=insert', '?type=', '?limit=101', '?page=0', '?page=1001'])(
    'rejects %s with 400 VALIDATION_ERROR',
    async (search) => {
      const res = await callList('1', search)
      const body = await res.json()

      expect(res.status).toBe(400)
      expect(body.code).toBe('VALIDATION_ERROR')
      expect(getMusicPage).not.toHaveBeenCalled()
    }
  )

  it('maps a missing anime to 404 ANIME_NOT_FOUND', async () => {
    getMusicPage.mockRejectedValue(animeNotFound(999))

    const res = await callList('999')
    const body = await res.json()

    expect(res.status).toBe(404)
    expect(body.code).toBe('ANIME_NOT_FOUND')
  })
})

describe('GET /api/anime/[malId]/music/[musicId]', () => {
  it('returns the music item', async () => {
    getMusicItem.mockResolvedValue({ value: item, isStale: true })

    const res = await callDetail('1', '10')
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(getMusicItem).toHaveBeenCalledWith(1, 10)
    expect(body.data).toEqual(item)
    expect(body.meta.stale).toBe(true)
  })

  it('rejects a non-positive music id with 400', async () => {
    const res = await callDetail('1', '0')
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.code).toBe('VALIDATION_ERROR')
    expect(getMusicItem).not.toHaveBeenCalled()
  })

  it('maps a foreign or missing music id to 404 MUSIC_NOT_FOUND', async () => {
    getMusicItem.mockRejectedValue(animeMusicNotFound(1, 42))

    const res = await callDetail('1', '42')
    const body = await res.json()

    expect(res.status).toBe(404)
    expect(body.code).toBe('MUSIC_NOT_FOUND')
  })

  it('maps a missing anime to 404 ANIME_NOT_FOUND', async () => {
    getMusicItem.mockRejectedValue(animeNotFound(999))

    const res = await callDetail('999', '1')
    const body = await res.json()

    expect(res.status).toBe(404)
    expect(body.code).toBe('ANIME_NOT_FOUND')
  })
})
