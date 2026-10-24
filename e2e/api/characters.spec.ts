/**
 * E2E tests for the character API over the real stack.
 *
 * @module e2e/api/characters
 */
import { expect, test } from '@playwright/test'
import {
  CATALOG_RATE_LIMIT_IP,
  SEED_ANIME_MAL_ID,
  SEED_CHARACTER_MAL_ID,
  SEED_CHARACTER_NAME,
  SEED_PERSON_MAL_ID,
} from '../fixtures/seed-data'

test.use({
  extraHTTPHeaders: {
    accept: 'application/json',
    'x-forwarded-for': CATALOG_RATE_LIMIT_IP,
  },
})

const base = `/api/characters/${SEED_CHARACTER_MAL_ID}`

test.describe('character endpoints', () => {
  test('finds the seeded character by name', async ({ request }) => {
    const res = await request.get(
      `/api/characters?query=${encodeURIComponent(SEED_CHARACTER_NAME)}`
    )
    expect(res.status()).toBe(200)
    const ids = (await res.json()).data.map((c: { malId: number }) => c.malId)
    expect(ids).toContain(SEED_CHARACTER_MAL_ID)
  })

  test('returns the profile with its Japanese voice', async ({ request }) => {
    const { data } = await (await request.get(base)).json()
    expect(data.name).toBe(SEED_CHARACTER_NAME)
    expect(data.voiceActors).toEqual([
      expect.objectContaining({
        language: 'Japanese',
        actors: [expect.objectContaining({ staffId: SEED_PERSON_MAL_ID })],
      }),
    ])
  })

  test('lists its appearance with a normalized role', async ({ request }) => {
    const { data } = await (await request.get(`${base}/appearances`)).json()
    expect(data).toContainEqual(
      expect.objectContaining({
        medium: 'anime',
        malId: SEED_ANIME_MAL_ID,
        role: 'main',
      })
    )
  })

  test('answers 404 for an unknown character', async ({ request }) => {
    const res = await request.get('/api/characters/2147480000/appearances')
    expect(res.status()).toBe(404)
    expect((await res.json()).code).toBe('CHARACTER_NOT_FOUND')
  })
})
