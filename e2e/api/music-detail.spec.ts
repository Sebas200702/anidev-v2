/**
 * E2E API tests for the music detail endpoint.
 *
 * @module e2e/api/music-detail
 * @remarks
 * Exercises `GET /api/music/:id` against the seeded music row, plus the 404 (unknown id) and 400
 * (malformed id) paths. Versions/artists are not seeded, so those collections are asserted as valid
 * arrays.
 */
import { expect, test } from '@playwright/test'
import { SEED_MUSIC } from '../fixtures/seed-data'

const SEED_MUSIC_ID = SEED_MUSIC[0].id

test.describe('GET /api/music/:id', () => {
  test('returns the seeded music detail', async ({ request }) => {
    const res = await request.get(`/api/music/${SEED_MUSIC_ID}`)
    expect(res.status()).toBe(200)

    const body = await res.json()
    expect(typeof body.data.title).toBe('string')
    expect(['OP', 'ED', 'UNK']).toContain(body.data.typeCode)
    expect(Array.isArray(body.data.versions)).toBe(true)
    expect(Array.isArray(body.data.artist)).toBe(true)
  })

  test('is 404 for an unknown id', async ({ request }) => {
    const res = await request.get('/api/music/2147480000')
    expect(res.status()).toBe(404)
    expect((await res.json()).code).toBe('MUSIC_NOT_FOUND')
  })

  test('is 400 for a malformed id', async ({ request }) => {
    const res = await request.get('/api/music/not-a-number')
    expect(res.status()).toBe(400)
  })
})
