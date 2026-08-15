/**
 * E2E: `GET /api/anime` list + free-text search against the real stack.
 *
 * @module e2e/api/anime-list
 */
import { expect, test } from '@playwright/test'
import { SEED_ANIME_MAL_ID, SEED_ANIME_QUERY } from '../fixtures/seed-data'

test.describe('GET /api/anime', () => {
  test('returns a valid paginated envelope', async ({ request }) => {
    const res = await request.get('/api/anime?page=1&limit=5')
    expect(res.status()).toBe(200)

    const body = await res.json()
    expect(Array.isArray(body.data)).toBe(true)
    expect(body.meta.page).toBe(1)
    expect(typeof body.meta.total).toBe('number')
    expect(typeof body.meta.hasNext).toBe('boolean')
  })

  test('free-text query returns the seeded anime', async ({ request }) => {
    const res = await request.get(
      `/api/anime?limit=10&query=${encodeURIComponent(SEED_ANIME_QUERY)}`
    )
    expect(res.status()).toBe(200)

    const body = await res.json()
    expect(body.meta.total).toBeGreaterThanOrEqual(1)
    const ids = body.data.map((card: { malId: number }) => card.malId)
    expect(ids).toContain(SEED_ANIME_MAL_ID)

    // Cards must satisfy the response contract (absolute image URLs, etc.).
    const seeded = body.data.find(
      (card: { malId: number }) => card.malId === SEED_ANIME_MAL_ID
    )
    expect(seeded.imageUrl).toMatch(/^https?:\/\//)
    expect(typeof seeded.title).toBe('string')
  })

  test('rejects invalid pagination with 400', async ({ request }) => {
    const res = await request.get('/api/anime?page=0')
    expect(res.status()).toBe(400)

    // The Zod wrapper's envelope is `{ data: null, status, error, meta }` — it
    // reports the failure via `error` + `meta.details.issues`, not a `code`.
    const body = await res.json()
    expect(body.data).toBeNull()
    expect(body.status).toBe(400)
    expect(body.error).toBe('Invalid request')
    expect(body.meta.details.issues.length).toBeGreaterThan(0)
  })
})
