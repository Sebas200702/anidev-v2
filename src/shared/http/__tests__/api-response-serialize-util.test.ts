/**
 * Tests for {@link jsonResponse} stale-marker serialization.
 *
 * @module shared/http/__tests__/api-response-serialize-util
 * @remarks
 * Verifies that a success envelope with `meta: { stale: true }` is surfaced as an
 * `x-stale: true` HTTP header (and never emitted for fresh responses), so clients
 * can detect degraded stale-serve responses from {@link withErrorHandling} routes.
 */
import { describe, expect, it } from 'vitest'
import { jsonResponse } from '@shared/http/api-response-serialize-util'

describe('jsonResponse stale header', () => {
  it('adds x-stale: true when meta.stale is true', async () => {
    const response = jsonResponse({
      data: { malId: 5114 },
      status: 200,
      meta: { stale: true },
    })

    expect(response.headers.get('x-stale')).toBe('true')
    expect(response.status).toBe(200)
  })

  it('omits x-stale for fresh responses (no stale flag)', async () => {
    const response = jsonResponse({
      data: { malId: 5114 },
      status: 200,
      meta: {},
    })

    expect(response.headers.get('x-stale')).toBeNull()
  })

  it('omits x-stale when meta.stale is false', async () => {
    const response = jsonResponse({
      data: [],
      status: 200,
      meta: { stale: false, page: 1 },
    })

    expect(response.headers.get('x-stale')).toBeNull()
    expect(JSON.parse(await response.text())).toEqual({
      data: [],
      status: 200,
      meta: { stale: false, page: 1 },
    })
  })

  it('preserves caller-provided headers when stale is set', async () => {
    const response = jsonResponse(
      { data: null, status: 500, meta: { stale: true } },
      { 'retry-after': '30' }
    )

    expect(response.headers.get('x-stale')).toBe('true')
    expect(response.headers.get('retry-after')).toBe('30')
  })
})
