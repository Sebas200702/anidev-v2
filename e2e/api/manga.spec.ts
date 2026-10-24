/**
 * E2E API tests for the printed-media (manga) endpoints and the catalog search.
 *
 * @module e2e/api/manga
 * @remarks
 * Runs `/api/manga`, `/api/manga/:malId`, `/full` and `/api/search?type=manga`
 * against the seeded work over the real stack (validation, cache, DB, envelope).
 */
import { expect, test } from '@playwright/test'
import {
  MANGA_RATE_LIMIT_IP,
  SEED_GENRE_NAME,
  SEED_MANGA_MAL_ID,
  SEED_MANGA_SYNONYM,
  SEED_MANGA_TITLE,
} from '../fixtures/seed-data'

test.use({
  extraHTTPHeaders: {
    accept: 'application/json',
    'x-forwarded-for': MANGA_RATE_LIMIT_IP,
  },
})

test.describe('manga endpoints', () => {
  test('lists the seeded work by title query', async ({ request }) => {
    const res = await request.get(
      `/api/manga?query=${encodeURIComponent(SEED_MANGA_TITLE)}`
    )
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.data.map((m: { malId: number }) => m.malId)).toContain(
      SEED_MANGA_MAL_ID
    )
  })

  test('returns the detail with its cast array', async ({ request }) => {
    const res = await request.get(`/api/manga/${SEED_MANGA_MAL_ID}`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.data.title).toBe(SEED_MANGA_TITLE)
    expect(body.data.genres).toContain(SEED_GENRE_NAME)
    expect(Array.isArray(body.data.characters)).toBe(true)
  })

  test('returns the nested /full payload', async ({ request }) => {
    const res = await request.get(`/api/manga/${SEED_MANGA_MAL_ID}/full`)
    expect(res.status()).toBe(200)
    const { data } = await res.json()
    expect(data.titles).toContainEqual({
      title: SEED_MANGA_SYNONYM,
      type: 'synonym',
    })
    expect(data.genres[0]).toMatchObject({ name: SEED_GENRE_NAME })
    expect(Array.isArray(data.relations)).toBe(true)
  })

  test('answers 404 for an unknown work', async ({ request }) => {
    const res = await request.get('/api/manga/2147480000/full')
    expect(res.status()).toBe(404)
    expect((await res.json()).code).toBe('MANGA_NOT_FOUND')
  })

  test('finds the work by synonym through /api/search', async ({ request }) => {
    const res = await request.get(
      `/api/search?type=manga&q=${encodeURIComponent(SEED_MANGA_SYNONYM)}`
    )
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.meta.type).toBe('manga')
    expect(body.data.map((m: { malId: number }) => m.malId)).toContain(
      SEED_MANGA_MAL_ID
    )
  })

  test('rejects a search without q', async ({ request }) => {
    const res = await request.get('/api/search?type=manga')
    expect(res.status()).toBe(400)
  })
})
