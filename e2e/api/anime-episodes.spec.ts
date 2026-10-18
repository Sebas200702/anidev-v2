/**
 * E2E API tests for the episode catalog endpoints.
 *
 * @module e2e/api/anime-episodes
 * @remarks
 * Runs `/api/anime/:malId/episodes` and `/episodes/:number` against the seeded episodes of
 * `SEED_ANIME_MAL_ID` over the real stack (validation, cache, DB, envelope), plus the 404 split
 * (unknown anime vs missing episode) and the 400 pagination bound.
 */
import { expect, test } from '@playwright/test'
import { SEED_ANIME_MAL_ID, SEED_EPISODES } from '../fixtures/seed-data'

const base = `/api/anime/${SEED_ANIME_MAL_ID}/episodes`

test.describe('anime episode endpoints', () => {
  test('lists seeded episodes in order with pagination meta', async ({
    request,
  }) => {
    const res = await request.get(`${base}?limit=2`)
    expect(res.status()).toBe(200)

    const body = await res.json()
    expect(body.data.map((e: { number: number }) => e.number)).toEqual([1, 2])
    expect(body.data[0]).not.toHaveProperty('synopsis')
    expect(body.meta).toMatchObject({
      page: 1,
      limit: 2,
      total: SEED_EPISODES.length,
      hasNext: true,
    })
  })

  test('returns one episode with its synopsis', async ({ request }) => {
    const res = await request.get(`${base}/2`)
    expect(res.status()).toBe(200)

    const body = await res.json()
    expect(body.data).toMatchObject({
      number: 2,
      title: SEED_EPISODES[1].title,
      synopsis: SEED_EPISODES[1].synopsis,
    })
  })

  test('404 EPISODE_NOT_FOUND for a missing episode', async ({ request }) => {
    const res = await request.get(`${base}/9999`)
    expect(res.status()).toBe(404)
    expect((await res.json()).code).toBe('EPISODE_NOT_FOUND')
  })

  test('404 ANIME_NOT_FOUND for an unknown anime', async ({ request }) => {
    const res = await request.get('/api/anime/999999999/episodes')
    expect(res.status()).toBe(404)
    expect((await res.json()).code).toBe('ANIME_NOT_FOUND')
  })

  test('400 for a limit over the bound', async ({ request }) => {
    const res = await request.get(`${base}?limit=101`)
    expect(res.status()).toBe(400)
  })
})
