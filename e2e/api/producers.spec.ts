/**
 * E2E tests for the producer API and the anime `producer` filter.
 *
 * @module e2e/api/producers
 */
import { expect, test } from '@playwright/test'
import {
  CATALOG_RATE_LIMIT_IP,
  SEED_ANIME_MAL_ID,
  SEED_MANGA_MAL_ID,
  SEED_PRODUCER_MAL_ID,
  SEED_PRODUCER_NAME,
} from '../fixtures/seed-data'

test.use({
  extraHTTPHeaders: {
    accept: 'application/json',
    'x-forwarded-for': CATALOG_RATE_LIMIT_IP,
  },
})

const ids = (data: { malId: number }[]) => data.map(({ malId }) => malId)

test.describe('producer endpoints', () => {
  test('finds the seeded studio by name', async ({ request }) => {
    const res = await request.get(
      `/api/producers?role=studio&query=${encodeURIComponent(SEED_PRODUCER_NAME)}`
    )
    expect(res.status()).toBe(200)
    expect((await res.json()).data).toContainEqual({
      malId: SEED_PRODUCER_MAL_ID,
      name: SEED_PRODUCER_NAME,
      works: 1,
    })
  })

  test('returns the studio detail with its counts', async ({ request }) => {
    const res = await request.get(`/api/producers/${SEED_PRODUCER_MAL_ID}`)
    expect(res.status()).toBe(200)
    const { data } = await res.json()
    expect(data.name).toBe(SEED_PRODUCER_NAME)
    expect(data.counts).toMatchObject({ studio: 1, serialization: 1 })
  })

  test('lists its anime and manga', async ({ request }) => {
    const anime = await request.get(
      `/api/producers/${SEED_PRODUCER_MAL_ID}/anime?role=studio`
    )
    expect(ids((await anime.json()).data)).toContain(SEED_ANIME_MAL_ID)
    const manga = await request.get(
      `/api/producers/${SEED_PRODUCER_MAL_ID}/manga`
    )
    expect(ids((await manga.json()).data)).toContain(SEED_MANGA_MAL_ID)
  })

  test('filters the anime list by studio', async ({ request }) => {
    const res = await request.get(
      `/api/anime?producer=${SEED_PRODUCER_MAL_ID}&producerRole=studio`
    )
    expect(res.status()).toBe(200)
    expect(ids((await res.json()).data)).toEqual([SEED_ANIME_MAL_ID])
  })

  test('answers 404 for an unknown producer', async ({ request }) => {
    const res = await request.get('/api/producers/2147480000/anime')
    expect(res.status()).toBe(404)
    expect((await res.json()).code).toBe('PRODUCER_NOT_FOUND')
  })
})
