/**
 * E2E: `GET /api/music` envelope sanity (second domain).
 *
 * @module e2e/api/music
 */
import { expect, test } from '@playwright/test'

test.describe('GET /api/music', () => {
  test('returns a valid paginated envelope', async ({ request }) => {
    const res = await request.get('/api/music?page=1&limit=5')
    expect(res.status()).toBe(200)

    const body = await res.json()
    expect(Array.isArray(body.data)).toBe(true)
    expect(body.meta.page).toBe(1)
    expect(typeof body.meta.total).toBe('number')
  })
})
