/**
 * Route tests for the media endpoints under `/api/anime/[malId]/media`.
 *
 * @module pages/api/anime/__tests__/anime-media-routes
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

const { getMediaPage, getMediaItem } = vi.hoisted(() => ({
  getMediaPage: vi.fn(),
  getMediaItem: vi.fn(),
}))
vi.mock('@anime/services/anime-media', () => ({
  animeMediaService: { getMediaPage, getMediaItem },
}))

const { GET: listRoute } = await import('../[malId]/media/index')
const { GET: detailRoute } = await import('../[malId]/media/[mediaId]')
const { animeNotFound, animeMediaNotFound } = await import('@anime/errors')

type RouteFn = (ctx: unknown) => Promise<Response>

const callList = (malId: string, search = '') =>
  (listRoute as RouteFn)({
    request: new Request(
      `http://localhost:4321/api/anime/${malId}/media${search}`
    ),
    params: { malId },
  })

const callDetail = (malId: string, mediaId: string) =>
  (detailRoute as RouteFn)({
    request: new Request(
      `http://localhost:4321/api/anime/${malId}/media/${mediaId}`
    ),
    params: { malId, mediaId },
  })

const item = {
  id: 3,
  mediaType: 'banner',
  size: 'default',
  source: 'anilist',
  url: '/media/anime/1/banner/default/1?source=anilist',
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('GET /api/anime/[malId]/media', () => {
  it('returns the page with pagination meta and the type filter', async () => {
    getMediaPage.mockResolvedValue({
      value: { list: [item], total: 3 },
      isStale: false,
    })

    const res = await callList('1', '?type=Banner&page=2&limit=1')
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(getMediaPage).toHaveBeenCalledWith({
      malId: 1,
      type: 'banner',
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
    getMediaPage.mockResolvedValue({
      value: { list: [item], total: 1 },
      isStale: false,
    })

    const body = await (await callList('1')).json()

    expect(getMediaPage).toHaveBeenCalledWith({
      malId: 1,
      type: undefined,
      page: 1,
      limit: 24,
    })
    expect(body.meta.hasNext).toBe(false)
  })

  it('rejects an out-of-range limit with 400', async () => {
    const res = await callList('1', '?limit=101')
    expect(res.status).toBe(400)
    expect(getMediaPage).not.toHaveBeenCalled()
  })

  it('rejects an empty type with 400', async () => {
    const res = await callList('1', '?type=')
    expect(res.status).toBe(400)
    expect(getMediaPage).not.toHaveBeenCalled()
  })

  it('maps a missing anime to 404 ANIME_NOT_FOUND', async () => {
    getMediaPage.mockRejectedValue(animeNotFound(999))

    const res = await callList('999')
    const body = await res.json()

    expect(res.status).toBe(404)
    expect(body.code).toBe('ANIME_NOT_FOUND')
  })
})

describe('GET /api/anime/[malId]/media/[mediaId]', () => {
  it('returns the media asset', async () => {
    getMediaItem.mockResolvedValue({ value: item, isStale: true })

    const res = await callDetail('1', '3')
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(getMediaItem).toHaveBeenCalledWith(1, 3)
    expect(body.data).toEqual(item)
    expect(body.meta.stale).toBe(true)
  })

  it('rejects a non-positive media id with 400', async () => {
    const res = await callDetail('1', '0')
    expect(res.status).toBe(400)
    expect(getMediaItem).not.toHaveBeenCalled()
  })

  it('maps a foreign or missing media id to 404 MEDIA_NOT_FOUND', async () => {
    getMediaItem.mockRejectedValue(animeMediaNotFound(1, 42))

    const res = await callDetail('1', '42')
    const body = await res.json()

    expect(res.status).toBe(404)
    expect(body.code).toBe('MEDIA_NOT_FOUND')
  })
})
