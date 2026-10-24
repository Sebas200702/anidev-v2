/**
 * E2E tests for the sitemaps and robots.txt over the real stack.
 *
 * @module e2e/api/seo
 */
import { expect, test } from '@playwright/test'
import { CATALOG_RATE_LIMIT_IP, SEED_ANIME_MAL_ID } from '../fixtures/seed-data'

test.use({ extraHTTPHeaders: { 'x-forwarded-for': CATALOG_RATE_LIMIT_IP } })

test.describe('SEO endpoints', () => {
  test('serves the sitemap index', async ({ request }) => {
    const res = await request.get('/sitemap.xml')
    expect(res.status()).toBe(200)
    expect(res.headers()['content-type']).toContain('application/xml')
    const body = await res.text()
    expect(body).toContain('<sitemapindex')
    expect(body).toContain('/sitemaps/anime-1.xml')
  })

  test('lists the seeded anime detail page', async ({ request }) => {
    // The seeded id is the highest in CI but not on a cloned catalog, so
    // look through every anime page the index announces.
    const index = await (await request.get('/sitemap.xml')).text()
    const pages = [...index.matchAll(/\/sitemaps\/(anime-\d+)\.xml/g)].map(
      ([, file]) => file
    )
    expect(pages.length).toBeGreaterThan(0)

    const bodies = await Promise.all(
      pages.map(async (file) => {
        const res = await request.get(`/sitemaps/${file}.xml`)
        expect(res.status()).toBe(200)
        return res.text()
      })
    )
    const found = bodies.some((body) =>
      body.includes(`/anime/${SEED_ANIME_MAL_ID}/`)
    )
    expect(found).toBe(true)
  })

  test('answers 404 for an unknown sitemap file', async ({ request }) => {
    expect((await request.get('/sitemaps/unknown-1.xml')).status()).toBe(404)
    expect((await request.get('/sitemaps/anime-9999.xml')).status()).toBe(404)
  })

  test('serves robots.txt', async ({ request }) => {
    const res = await request.get('/robots.txt')
    expect(res.status()).toBe(200)
    const body = await res.text()
    expect(body).toContain('Disallow: /api/')
    expect(body).toMatch(/Sitemap: https?:\/\/.+\/sitemap\.xml/)
  })
})
