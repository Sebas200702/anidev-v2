/**
 * E2E tests for the people API over the real stack.
 *
 * @module e2e/api/people
 */
import { expect, test } from '@playwright/test'
import {
  CATALOG_RATE_LIMIT_IP,
  SEED_ANIME_MAL_ID,
  SEED_CHARACTER_MAL_ID,
  SEED_MUSIC,
  SEED_PERSON_MAL_ID,
  SEED_PERSON_NAME,
} from '../fixtures/seed-data'

test.use({
  extraHTTPHeaders: {
    accept: 'application/json',
    'x-forwarded-for': CATALOG_RATE_LIMIT_IP,
  },
})

const base = `/api/people/${SEED_PERSON_MAL_ID}`

test.describe('people endpoints', () => {
  test('finds the seeded person by name', async ({ request }) => {
    const res = await request.get(
      `/api/people?query=${encodeURIComponent(SEED_PERSON_NAME)}`
    )
    const ids = (await res.json()).data.map((p: { malId: number }) => p.malId)
    expect(ids).toContain(SEED_PERSON_MAL_ID)
  })

  test('returns the profile with one item per list', async ({ request }) => {
    const { data } = await (await request.get(base)).json()
    expect(data.counts).toEqual({
      voices: 1,
      animeCredits: 1,
      mangaCredits: 0,
      music: 1,
    })
  })

  test('lists voices, credits and music', async ({ request }) => {
    const voices = (await (await request.get(`${base}/voices`)).json()).data
    expect(voices[0].character.malId).toBe(SEED_CHARACTER_MAL_ID)
    expect(voices[0].anime[0].malId).toBe(SEED_ANIME_MAL_ID)

    const credits = (await (await request.get(`${base}/credits`)).json()).data
    expect(credits).toEqual([
      expect.objectContaining({
        malId: SEED_ANIME_MAL_ID,
        positions: ['Director'],
      }),
    ])

    const music = (await (await request.get(`${base}/music`)).json()).data
    expect(music.map((m: { id: number }) => m.id)).toEqual([SEED_MUSIC[0].id])
  })

  test('answers 404 for an unknown person', async ({ request }) => {
    const res = await request.get('/api/people/2147480000/credits')
    expect(res.status()).toBe(404)
    expect((await res.json()).code).toBe('PERSON_NOT_FOUND')
  })
})
