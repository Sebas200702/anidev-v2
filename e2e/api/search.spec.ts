/**
 * E2E: `GET /search` taxonomy/keyword results page over the real stack.
 *
 * @module e2e/api/search
 * @remarks
 * The genre-pill and nav links promise this route: a genre-exclusive seed row
 * must be found here, unknown genres render an empty 200 (not an error), and
 * out-of-range pages are rejected with 400.
 */
import { expect, test } from '@playwright/test'
import { SEED_ANIME_MAL_ID, SEED_GENRE_NAME } from '../fixtures/seed-data'

test.describe('GET /search', () => {
  test('finds the genre-exclusive seed row', async ({ request }) => {
    const res = await request.get(
      `/search?genre=${encodeURIComponent(SEED_GENRE_NAME)}`
    )
    expect(res.status()).toBe(200)
    const html = await res.text()
    expect(html).toContain(String(SEED_ANIME_MAL_ID))
  })

  test('unknown genre renders an empty 200, not an error', async ({
    request,
  }) => {
    const res = await request.get('/search?genre=No-Such-Genre-Xyz')
    expect(res.status()).toBe(200)
    expect(await res.text()).toContain('No results')
  })

  test('rejects page over the bound with 400', async ({ request }) => {
    const res = await request.get('/search?page=10001')
    expect(res.status()).toBe(400)
  })

  test('renders exactly one h1', async ({ request }) => {
    const res = await request.get('/search')
    expect(res.status()).toBe(200)
    const html = await res.text()
    expect(html.match(/<h1[ >]/g)?.length ?? 0).toBe(1)
  })
})
