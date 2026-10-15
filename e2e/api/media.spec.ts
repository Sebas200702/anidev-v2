/**
 * E2E API tests for the semantic media route.
 *
 * @module e2e/api/media
 * @remarks
 * Covers the deterministic validation path (malformed path → 400) and that a well-formed path for a
 * seeded entity is accepted and served without a server error (the resolver falls back to the
 * placeholder asset when no media is seeded).
 */
import { expect, test } from '@playwright/test'
import { SEED_ANIME_MAL_ID } from '../fixtures/seed-data'

test.describe('GET /media/*', () => {
  test('rejects a malformed path with 400', async ({ request }) => {
    const res = await request.get('/media/anime/not-a-number/poster')
    expect(res.status()).toBe(400)
  })

  test('rejects an unsupported entity with 400', async ({ request }) => {
    const res = await request.get('/media/not-an-entity/1/poster')
    expect(res.status()).toBe(400)
  })

  test('serves a well-formed path without a server error', async ({
    request,
  }) => {
    const res = await request.get(`/media/anime/${SEED_ANIME_MAL_ID}/poster`)
    // No media seeded → placeholder fallback; must not be a 4xx-validation or 5xx.
    expect(res.status()).toBeLessThan(500)
    expect(res.status()).not.toBe(400)
  })

  test('serves hardening headers on media responses', async ({ request }) => {
    const res = await request.get(`/media/anime/${SEED_ANIME_MAL_ID}/poster`)
    expect(res.headers()['x-request-id']).toBeDefined()
    expect(res.headers()['x-content-type-options']).toBe('nosniff')
  })

  test('rejects out-of-range width with 400', async ({ request }) => {
    const res = await request.get(
      `/media/anime/${SEED_ANIME_MAL_ID}/poster/large?w=99999`
    )
    expect(res.status()).toBe(400)
  })

  // Raw-media `nosniff` on 200 bytes has no fixture source (no seeded upstream
  // media); the route-level unit test asserts the header on raw 200/206.
  // Range behavior is covered by route unit tests (206 + Content-Range).

  test('refuses remote /_image transforms (no remotePatterns configured)', async ({
    request,
  }) => {
    const res = await request.get(
      '/_image?href=https%3A%2F%2Fcdn.myanimelist.net%2Fimage.jpg&w=100&f=webp'
    )
    // Remote not allowlisted → Astro refuses with 403, never a server error.
    expect(res.status()).toBe(403)
  })
})
