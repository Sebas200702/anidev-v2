/**
 * Route tests for the printed-media endpoints under `/api/manga`.
 *
 * @module pages/api/manga/__tests__/manga-routes
 * @remarks
 * Drives the real request-validation + error-handling wrappers with mocked
 * services. The response schemas are replaced with a permissive schema (their
 * strictness is covered by the schema-level tests) so these focus on wiring:
 * query coercion → service call → success envelope, and the 404 for a work
 * that does not exist.
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

const { getList, getDetails } = vi.hoisted(() => ({
  getList: vi.fn(),
  getDetails: vi.fn(),
}))

vi.mock('@manga/services/manga-service', () => ({
  mangaListService: { getMangaList: getList },
  mangaDetailsService: { getMangaDetails: getDetails },
  mapMangaFilters: (params: unknown) => params,
}))

vi.mock('@manga/schemas/manga-schema', async (orig) => ({
  ...(await orig<typeof import('@manga/schemas/manga-schema')>()),
  mangaListResponseSchema: z.any(),
  mangaDetailsResponseSchema: z.any(),
}))

const { GET: listRoute } = await import('../index')
const { GET: detailRoute } = await import('../[malId]/index')

const card = {
  malId: 1,
  title: 'Monster',
  type: 'manga',
  year: 1997,
  status: 'Finished',
  score: 9,
  chapters: 162,
  imageUrl: 'http://localhost:4321/media/manga/1/cover/large',
  smallImageUrl: 'http://localhost:4321/media/manga/1/cover/small',
  altImageText: 'Monster',
}

describe('GET /api/manga', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getList.mockResolvedValue({ value: { list: [card], total: 1 }, isStale: false })
  })

  it('returns the paginated list with the total', async () => {
    const response = await listRoute({
      request: new Request('http://localhost/api/manga?page=1&limit=10&type=novel'),
      params: {},
      locals: {},
    } as never)

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data).toHaveLength(1)
    expect(body.data[0].malId).toBe(1)
    expect(body.meta.total).toBe(1)
    expect(getList).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, limit: 10, type: 'novel' })
    )
  })

  it('rejects an invalid page', async () => {
    const response = await listRoute({
      request: new Request('http://localhost/api/manga?page=0'),
      params: {},
      locals: {},
    } as never)

    expect(response.status).toBe(400)
    expect(getList).not.toHaveBeenCalled()
  })
})

describe('GET /api/manga/:malId', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getDetails.mockResolvedValue({
      value: { ...card, genres: ['Drama'], synopsis: 'Un的作品' },
      isStale: false,
    })
  })

  it('returns the work detail', async () => {
    const response = await detailRoute({
      request: new Request('http://localhost/api/manga/1'),
      params: { malId: '1' },
      locals: {},
    } as never)

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.malId).toBe(1)
    expect(getDetails).toHaveBeenCalledWith(1)
  })

  it('answers 404 for an unknown work', async () => {
    getDetails.mockRejectedValue(
      new (await import('@shared/errors/app-error')).DomainError(
        'MANGA_NOT_FOUND',
        'Manga not found',
        { malId: 99999999 }
      )
    )

    const response = await detailRoute({
      request: new Request('http://localhost/api/manga/99999999'),
      params: { malId: '99999999' },
      locals: {},
    } as never)

    expect(response.status).toBe(404)
    const body = await response.json()
    expect(body.data).toBeNull()
    expect(body.code).toBe('MANGA_NOT_FOUND')
  })

  it('rejects a non-numeric id', async () => {
    const response = await detailRoute({
      request: new Request('http://localhost/api/manga/abc'),
      params: { malId: 'abc' },
      locals: {},
    } as never)

    expect(response.status).toBe(400)
    expect(getDetails).not.toHaveBeenCalled()
  })
})
