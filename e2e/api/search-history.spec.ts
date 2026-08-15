/**
 * E2E (flagship): the full search-history wiring over real HTTP + Postgres.
 *
 * @module e2e/api/search-history
 * @remarks
 * Spans the exact integration unit/integration tests cannot cover: a real
 * session cookie → `GET /api/anime?query=…` recording → a Postgres row → authed
 * read → clear, plus the anonymous 401 gate on both verbs.
 */
import { expect, test } from '../fixtures/auth'
import { SEED_ANIME_QUERY } from '../fixtures/seed-data'

test.describe('search history', () => {
  test('records an authed search, lists it, then clears it', async ({
    authedRequest,
  }) => {
    // 1. An authenticated search with real intent records a best-effort entry.
    const search = await authedRequest.get(
      `/api/anime?limit=5&query=${encodeURIComponent(SEED_ANIME_QUERY)}`
    )
    expect(search.status()).toBe(200)

    // 2. The history lists it, newest-first, without leaking the user id.
    const list = await authedRequest.get('/api/search-history')
    expect(list.status()).toBe(200)
    expect(list.headers()['cache-control']).toContain('no-store')

    const listBody = await list.json()
    expect(Array.isArray(listBody.data)).toBe(true)
    expect(listBody.data.length).toBeGreaterThanOrEqual(1)

    const entry = listBody.data[0]
    expect(entry.scope).toBe('anime')
    expect(entry.query).toBe(SEED_ANIME_QUERY)
    expect(entry.userId).toBeUndefined()

    // 3. Clearing removes the persisted rows.
    const clear = await authedRequest.delete('/api/search-history')
    expect(clear.status()).toBe(200)
    expect((await clear.json()).data.removed).toBeGreaterThanOrEqual(1)

    // 4. History is now empty for this user.
    const empty = await authedRequest.get('/api/search-history')
    expect((await empty.json()).data).toHaveLength(0)
  })

  test('anonymous callers are rejected on read and clear', async ({
    request,
  }) => {
    const read = await request.get('/api/search-history')
    expect(read.status()).toBe(401)
    expect((await read.json()).code).toBe('AUTH_REQUIRED')

    const clear = await request.delete('/api/search-history')
    expect(clear.status()).toBe(401)
    expect((await clear.json()).code).toBe('AUTH_REQUIRED')
  })
})
