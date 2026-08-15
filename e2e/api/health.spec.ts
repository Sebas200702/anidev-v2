/**
 * E2E: health & readiness endpoints against the real stack.
 *
 * @module e2e/api/health
 */
import { expect, test } from '@playwright/test'

test.describe('health', () => {
  test('GET /api/health is 200', async ({ request }) => {
    const res = await request.get('/api/health')
    expect(res.status()).toBe(200)
  })

  test('GET /api/health/readiness reports dependencies up', async ({
    request,
  }) => {
    // The webServer only starts once readiness is 200, so by the time specs run
    // this must be green — it proves DB + cache are actually reachable.
    const res = await request.get('/api/health/readiness')
    expect(res.status()).toBe(200)
  })
})
