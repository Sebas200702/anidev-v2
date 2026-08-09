/**
 * Tests that {@link mapErrorToHttp} maps infrastructure errors to `503 Service
 * Unavailable` with a `Retry-After` header and a preserved stable code, while
 * keeping unknown errors on `500`.
 *
 * @module shared/errors/__tests__/map-error-to-http.test
 * @remarks
 * Mocks `@config/env` and `@sentry/node` per project convention (the runner
 * does not load `.env`; Sentry is captured but must stay a no-op in tests).
 */
import { describe, expect, it, vi } from 'vitest'
import { ErrorCodes } from '@shared/errors/codes'
import { InfraError } from '@shared/errors/app-error'
import { dbError } from '@shared/errors/db-errors'
import { mapErrorToHttp } from '@shared/errors/map-error-to-http'

vi.mock('@config/env', () => ({
  env: {
    NODE_ENV: 'test',
    LOG_LEVEL: 'silent',
  },
}))

vi.mock('@sentry/node', () => ({
  captureException: vi.fn(),
}))

describe('mapErrorToHttp infra errors', () => {
  it('maps DB_ERROR to 503 with Retry-After, generic message and preserved code', () => {
    const { status, body, headers } = mapErrorToHttp(
      dbError('findAnimeById', { malId: 1 })
    )

    expect(status).toBe(503)
    expect(headers?.['Retry-After']).toBeDefined()
    expect(body.code).toBe(ErrorCodes.DB_ERROR)
    expect(body.message).toMatch(/service unavailable/i)
    expect(body.meta?.details).toMatchObject({ malId: 1 })
  })

  it('maps CACHE_ERROR to 503 with its code', () => {
    const { status, body } = mapErrorToHttp(
      new InfraError(ErrorCodes.CACHE_ERROR, 'Cache write failed')
    )

    expect(status).toBe(503)
    expect(body.code).toBe(ErrorCodes.CACHE_ERROR)
    expect(body.message).toMatch(/service unavailable/i)
  })

  it('maps EXTERNAL_API_ERROR to 503 with its code', () => {
    const { status, body } = mapErrorToHttp(
      new InfraError(ErrorCodes.EXTERNAL_API_ERROR, 'Upstream fetch failed')
    )

    expect(status).toBe(503)
    expect(body.code).toBe(ErrorCodes.EXTERNAL_API_ERROR)
  })

  it('keeps unknown errors on 500 with UNKNOWN_ERROR and no Retry-After', () => {
    const result = mapErrorToHttp(new Error('boom'))

    expect(result.status).toBe(500)
    expect(result.body.code).toBe(ErrorCodes.UNKNOWN_ERROR)
    expect(result.headers).toBeUndefined()
    expect(result.body.message).toMatch(/internal server error/i)
  })
})
