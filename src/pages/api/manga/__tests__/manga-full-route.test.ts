/**
 * Route tests for `GET /api/manga/:malId/full`.
 *
 * @module pages/api/manga/__tests__/manga-full-route
 * @remarks
 * Real validation + error-handling wrappers and the real response schema; only
 * the service is mocked.
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

const { getFull } = vi.hoisted(() => ({ getFull: vi.fn() }))
vi.mock('@manga/services/manga-full', () => ({
  mangaFullService: { getMangaFullByMalId: getFull },
}))

const { GET: fullRoute } = await import('../[malId]/full')
const { DomainError } = await import('@shared/errors/app-error')

const media = 'http://localhost:4321/media/manga/2/cover/large'
const fullManga = {
  malId: 2,
  title: 'Berserk',
  titleEnglish: 'Berserk',
  titleJapanese: null,
  type: 'manga',
  status: 'Publishing',
  year: 1989,
  chapters: null,
  volumes: null,
  score: 9.4,
  synopsis: 'Guts.',
  background: '',
  serialization: null,
  countryOfOrigin: 'JP',
  publishedFrom: '1989-08-25',
  publishedTo: null,
  imageUrl: media,
  smallImageUrl: media,
  bannerImageUrl: media,
  characters: [],
  staff: [],
  publishers: [],
  externalLinks: [],
  slug: 'berserk',
  url: 'http://localhost:4321/manga/2/berserk',
  altImageText: 'Berserk',
  titles: [{ title: 'Berserk', type: 'main' }],
  genres: [{ malId: 1, name: 'Action' }],
  themes: [],
  demographics: [{ malId: 42, name: 'Seinen' }],
  relations: [],
}

const call = (malId: string) =>
  fullRoute({
    request: new Request(`http://localhost/api/manga/${malId}/full`),
    params: { malId },
    locals: {},
  } as never)

describe('GET /api/manga/:malId/full', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getFull.mockResolvedValue({ value: fullManga, isStale: false })
  })

  it('returns the extended payload validated by the response schema', async () => {
    const response = await call('2')

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.genres).toEqual([{ malId: 1, name: 'Action' }])
    expect(getFull).toHaveBeenCalledWith(2)
  })

  it('answers 404 for an unknown work', async () => {
    getFull.mockRejectedValue(
      new DomainError('MANGA_NOT_FOUND', 'Manga not found', { malId: 9 })
    )
    const response = await call('9')
    expect(response.status).toBe(404)
  })

  it('rejects a non-numeric id', async () => {
    const response = await call('abc')
    expect(response.status).toBe(400)
    expect(getFull).not.toHaveBeenCalled()
  })
})
