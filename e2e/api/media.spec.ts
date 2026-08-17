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
})
