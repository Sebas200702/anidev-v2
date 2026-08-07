/**
 * Tests that database repositories translate connection failures into mappable
 * {@link InfraError} instances (task: DB down degrades to an elegant 500).
 *
 * @module domains/anime/__tests__/repositories/db-degradation
 * @remarks
 * Mocks the Drizzle `db` client so `.select().from()` rejects, then asserts the
 * repository throws `dbError` (an {@link InfraError}) which `mapErrorToHttp`
 * maps to HTTP 500 — the client gets a generic message, never a raw stack trace
 * or process crash.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mapErrorToHttp } from '@shared/errors/map-error-to-http'
import { InfraError } from '@shared/errors/app-error'
import { ErrorCodes } from '@shared/errors/codes'

vi.mock('@config/env', () => ({
  env: {
    NODE_ENV: 'test',
    DATABASE_URL: 'postgres://test:test@localhost:5432/test',
    REDIS_URL: 'redis://localhost:6379',
    APP_BASE_URL: 'http://localhost:4321',
    BETTER_AUTH_SECRET: 'test-secret-test-secret-test-secret-test-secret',
    SENTRY_DSN: undefined,
    LOG_LEVEL: 'silent',
  },
}))

vi.mock('@sentry/node', () => ({
  captureException: vi.fn(),
}))

const { selectMock } = vi.hoisted(() => ({
  selectMock: vi.fn(),
}))

vi.mock('@db/client', () => ({
  db: {
    select: selectMock,
  },
}))

import { animeExternalRepository } from '@domains/anime/repositories/anime-external-repository'

describe('DB repository degradation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('throws InfraError with DB_ERROR code when the database connection fails', async () => {
    selectMock.mockReturnValue({
      from: () => ({
        where: () => ({
          limit: () => Promise.reject(new Error('connection refused')),
        }),
      }),
    })

    await expect(
      animeExternalRepository.getExternalLinksByAnimeId(5114)
    ).rejects.toBeInstanceOf(InfraError)
  })

  it('maps the degraded DB error to a 500 response with a generic client message', async () => {
    selectMock.mockReturnValue({
      from: () => ({
        where: () => ({
          limit: () => Promise.reject(new Error('down')),
        }),
      }),
    })

    let caught: unknown
    try {
      await animeExternalRepository.getExternalLinksByAnimeId(5114)
    } catch (error) {
      caught = error
    }

    const { status, body } = mapErrorToHttp(caught)

    expect(status).toBe(500)
    expect((caught as InfraError).code).toBe(ErrorCodes.DB_ERROR)
    expect(body.message).toMatch(/Internal server error/i)
  })
})
