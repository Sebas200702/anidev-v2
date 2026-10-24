/**
 * Route tests for `/sitemap.xml`, `/sitemaps/:file` and `/robots.txt`.
 *
 * @module pages/__tests__/seo-routes
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@config/env', () => ({
  env: {
    NODE_ENV: 'test',
    LOG_LEVEL: 'silent',
    APP_BASE_URL: 'https://anidev.example',
  },
}))

const { getIndex, getPage } = vi.hoisted(() => ({
  getIndex: vi.fn(),
  getPage: vi.fn(),
}))
vi.mock('@seo/services/sitemap', () => ({
  sitemapService: { getIndex, getPage },
}))

const { GET: indexRoute } = await import('../sitemap.xml')
const { GET: pageRoute } = await import('../sitemaps/[file]')
const { GET: robotsRoute } = await import('../robots.txt')
const { InfraError } = await import('@shared/errors/app-error')
const { sitemapNotFound } = await import('@seo/errors')

const call = (route: typeof indexRoute, params: Record<string, string> = {}) =>
  route({ params } as never) as Promise<Response>

describe('SEO routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('serves the sitemap index as cacheable XML', async () => {
    getIndex.mockResolvedValue({ value: '<sitemapindex/>', isStale: false })
    const res = await call(indexRoute)
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('application/xml')
    expect(res.headers.get('cache-control')).toContain('max-age')
    expect(await res.text()).toBe('<sitemapindex/>')
  })

  it('answers 503 with Retry-After when the index cannot be built', async () => {
    getIndex.mockRejectedValue(new InfraError('DB_ERROR', 'down'))
    const res = await call(indexRoute)
    expect(res.status).toBe(503)
    expect(res.headers.get('retry-after')).toBeTruthy()
  })

  it('parses <segment>-<n>.xml and serves the page', async () => {
    getPage.mockResolvedValue({ value: '<urlset/>', isStale: false })
    const res = await call(pageRoute, { file: 'anime-2.xml' })
    expect(res.status).toBe(200)
    expect(getPage).toHaveBeenCalledWith('anime', 2)
  })

  it.each(['anime.xml', 'anime-1.json', '../x-1.xml', 'anime-0001234567.xml'])(
    'answers 404 for the malformed file %s',
    async (file) => {
      const res = await call(pageRoute, { file })
      expect(res.status).toBe(404)
      expect(getPage).not.toHaveBeenCalled()
    }
  )

  it('answers 404 when the service rejects the page', async () => {
    getPage.mockRejectedValue(sitemapNotFound('anime-9'))
    const res = await call(pageRoute, { file: 'anime-9.xml' })
    expect(res.status).toBe(404)
  })

  it('serves robots.txt', async () => {
    const res = await call(robotsRoute)
    expect(res.headers.get('content-type')).toContain('text/plain')
    const body = await res.text()
    expect(body).toContain('Disallow: /api/')
    expect(body).toContain('Disallow: /showcase')
    expect(body).toContain('Sitemap: https://anidev.example/sitemap.xml')
  })
})
