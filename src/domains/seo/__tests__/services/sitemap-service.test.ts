import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@config/env', () => ({
  env: {
    NODE_ENV: 'test',
    LOG_LEVEL: 'silent',
    APP_BASE_URL: 'https://anidev.example',
  },
}))
vi.mock('@lib/cache', () => ({
  cacheGet: vi.fn(),
  cacheSet: vi.fn(),
  withStaleCache: async (opts: { compute: () => Promise<unknown> }) => ({
    value: await opts.compute(),
    isStale: false,
  }),
}))
vi.mock('@lib/cache/config', () => ({ CacheTtl: { Long: 1, Stale: 2 } }))
vi.mock('@seo/constants', async (orig) => ({
  ...(await orig<typeof import('@seo/constants')>()),
  SITEMAP_PAGE_SIZE: 2,
}))

const repo = vi.hoisted(() => ({
  countAnime: vi.fn(),
  getAnimePage: vi.fn(),
  getGenreNames: vi.fn(),
}))
vi.mock('@seo/repositories/sitemap', () => ({ sitemapRepository: repo }))

const { sitemapService } = await import('@seo/services/sitemap')

describe('sitemapService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    repo.countAnime.mockResolvedValue(3)
    repo.getAnimePage.mockResolvedValue([{ malId: 1, title: 'Cowboy Bebop' }])
    repo.getGenreNames.mockResolvedValue(['Slice of Life'])
  })

  it('indexes every page of every segment', async () => {
    const { value } = await sitemapService.getIndex()
    for (const file of ['static-1', 'anime-1', 'anime-2', 'genres-1']) {
      expect(value).toContain(`/sitemaps/${file}.xml`)
    }
    expect(value).not.toContain('anime-3')
  })

  it('renders anime detail URLs with their slug', async () => {
    const { value } = await sitemapService.getPage('anime', 2)
    expect(repo.getAnimePage).toHaveBeenCalledWith(2, 2)
    expect(value).toContain(
      '<loc>https://anidev.example/anime/1/cowboy-bebop</loc>'
    )
  })

  it('encodes genre query values', async () => {
    const { value } = await sitemapService.getPage('genres', 1)
    expect(value).toContain('/search?genre=Slice%20of%20Life')
  })

  it.each([
    ['unknown', 1],
    ['anime', 3],
    ['anime', 0],
    ['static', 2],
  ])('rejects %s-%i as SITEMAP_NOT_FOUND', async (segment, page) => {
    await expect(sitemapService.getPage(segment, page)).rejects.toMatchObject({
      code: 'SITEMAP_NOT_FOUND',
    })
  })
})
