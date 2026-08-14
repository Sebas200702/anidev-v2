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
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as SentryNode from '@sentry/node'
import { ErrorCodes } from '@shared/errors/codes'
import {
  AuthError,
  DomainError,
  InfraError,
  ResponseValidationError,
  ValidationError,
} from '@shared/errors/app-error'
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

describe('mapErrorToHttp response validation', () => {
  it('maps RESPONSE_VALIDATION_ERROR to 500 with a generic message and no leaked details', () => {
    const { status, body, headers } = mapErrorToHttp(
      new ResponseValidationError([{ path: ['data'], message: 'bad' }])
    )

    expect(status).toBe(500)
    expect(headers?.['Retry-After']).toBeUndefined()
    expect(body.code).toBe(ErrorCodes.RESPONSE_VALIDATION_ERROR)
    expect(body.message).toMatch(/internal server error/i)
    expect(body.meta?.details).toBeUndefined()
  })
})

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

describe('mapErrorToHttp sentry capture', () => {
  beforeEach(() => {
    vi.mocked(SentryNode.captureException).mockClear()
  })

  it('reports ValidationError as warning for a 400 response', () => {
    const error = new ValidationError(
      ErrorCodes.VALIDATION_ERROR,
      'Invalid request',
      {
        issues: [],
      }
    )

    const response = mapErrorToHttp(error)

    expect(response.status).toBe(400)
    expect(SentryNode.captureException).toHaveBeenCalledTimes(1)
    expect(SentryNode.captureException).toHaveBeenCalledWith(error, {
      level: 'warning',
    })
  })

  it('reports AuthError as warning for a 401 response', () => {
    const error = new AuthError(
      ErrorCodes.AUTH_REQUIRED,
      'Authentication required'
    )

    const response = mapErrorToHttp(error)

    expect(response.status).toBe(401)
    expect(SentryNode.captureException).toHaveBeenCalledTimes(1)
    expect(SentryNode.captureException).toHaveBeenCalledWith(error, {
      level: 'warning',
    })
  })

  it('reports DomainError as warning for a 404 response', () => {
    const error = new DomainError(ErrorCodes.ANIME_NOT_FOUND, 'Anime not found')

    const response = mapErrorToHttp(error)

    expect(response.status).toBe(404)
    expect(SentryNode.captureException).toHaveBeenCalledTimes(1)
    expect(SentryNode.captureException).toHaveBeenCalledWith(error, {
      level: 'warning',
    })
  })

  it('reports DomainError as warning for a 400 response', () => {
    const error = new DomainError(
      ErrorCodes.INVALID_IMAGE_PATH,
      'Invalid media path'
    )

    const response = mapErrorToHttp(error)

    expect(response.status).toBe(400)
    expect(SentryNode.captureException).toHaveBeenCalledTimes(1)
    expect(SentryNode.captureException).toHaveBeenCalledWith(error, {
      level: 'warning',
    })
  })

  it('reports InfraError as error for a 503 response', () => {
    const error = dbError('findAnimeById', { malId: 1 })

    const response = mapErrorToHttp(error)

    expect(response.status).toBe(503)
    expect(SentryNode.captureException).toHaveBeenCalledTimes(1)
    expect(SentryNode.captureException).toHaveBeenCalledWith(error, {
      level: 'error',
    })
  })

  it('reports unknown errors as error for a 500 response', () => {
    const error = new Error('boom')

    const response = mapErrorToHttp(error)

    expect(response.status).toBe(500)
    expect(SentryNode.captureException).toHaveBeenCalledTimes(1)
    expect(SentryNode.captureException).toHaveBeenCalledWith(error, {
      level: 'error',
    })
  })
})
