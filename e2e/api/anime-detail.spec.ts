/**
 * E2E API tests for the anime detail endpoints.
 *
 * @module e2e/api/anime-detail
 * @remarks
 * Exercises `/api/anime/:malId`, `/full`, `/characters`, and `/staff` against the seeded anime
 * (`SEED_ANIME_MAL_ID`), plus the 404 (unknown id) and 400 (malformed id) paths. Related tables are
 * not seeded, so nested collections are asserted as valid-but-possibly-empty shapes.
 */
import { expect, test } from '@playwright/test'
import { SEED_ANIME_MAL_ID } from '../fixtures/seed-data'

test.describe('anime detail endpoints', () => {
  test('GET /api/anime/:malId returns the seeded anime', async ({
    request,
  }) => {
    const res = await request.get(`/api/anime/${SEED_ANIME_MAL_ID}`)
    expect(res.status()).toBe(200)

    const body = await res.json()
    expect(body.data.malId).toBe(SEED_ANIME_MAL_ID)
    expect(typeof body.data.title).toBe('string')
    expect(body.data.imageUrl).toMatch(/^https?:\/\//)
  })

  test('GET /api/anime/:malId/full returns the expanded payload', async ({
    request,
  }) => {
    const res = await request.get(`/api/anime/${SEED_ANIME_MAL_ID}/full`)
    expect(res.status()).toBe(200)

    const body = await res.json()
    expect(body.data.malId).toBe(SEED_ANIME_MAL_ID)
    expect(Array.isArray(body.data.titles)).toBe(true)
    expect(Array.isArray(body.data.music.openings)).toBe(true)
    expect(Array.isArray(body.data.music.endings)).toBe(true)
    expect(Array.isArray(body.data.relations)).toBe(true)
  })

  test('GET /api/anime/:malId/characters returns an array', async ({
    request,
  }) => {
    const res = await request.get(`/api/anime/${SEED_ANIME_MAL_ID}/characters`)
    expect(res.status()).toBe(200)
    expect(Array.isArray((await res.json()).data)).toBe(true)
  })

  test('GET /api/anime/:malId/staff returns an array', async ({ request }) => {
    const res = await request.get(`/api/anime/${SEED_ANIME_MAL_ID}/staff`)
    expect(res.status()).toBe(200)
    expect(Array.isArray((await res.json()).data)).toBe(true)
  })

  test('GET /api/anime/:malId/full is 404 for an unknown id', async ({
    request,
  }) => {
    const res = await request.get('/api/anime/2147480000/full')
    expect(res.status()).toBe(404)
    expect((await res.json()).code).toBe('ANIME_NOT_FOUND')
  })

  test('GET /api/anime/:malId is 400 for a malformed id', async ({
    request,
  }) => {
    const res = await request.get('/api/anime/not-a-number')
    expect(res.status()).toBe(400)
  })
})
