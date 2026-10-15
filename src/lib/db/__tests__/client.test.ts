/**
 * Tests that the PostgreSQL {@link module:lib/db/client} pool handles idle-client
 * `error` events so a DB bounce during runtime does not crash the process.
 *
 * @module lib/db/__tests__/client
 * @remarks
 * node-postgres `pg-pool` re-emits an `error` event on behalf of an idle pooled
 * client that fails. Without a listener `EventEmitter` raises `error` as an
 * uncaught exception and kills the process — exactly the "database recovers
 * without restarted process" scenario. This test drives a mock Pool and asserts
 * the module attaches a handler that logs instead of throwing.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { poolOnMock, captureHandler, poolCtorArgs } = vi.hoisted(() => {
  let registeredHandler: ((err: Error) => void) | undefined
  const poolCtorArgs: unknown[] = []
  const poolOnMock = vi.fn((event: string, handler: (err: Error) => void) => {
    if (event === 'error') registeredHandler = handler
  })
  return {
    poolOnMock,
    captureHandler: () => registeredHandler,
    poolCtorArgs,
  }
})

vi.mock('@config/env', () => ({
  env: {
    NODE_ENV: 'test',
    DATABASE_URL: 'postgres://test:test@localhost:5432/test',
    REDIS_URL: 'redis://localhost:6379',
    SENTRY_DSN: undefined,
    APP_BASE_URL: 'http://localhost:4321',
    BETTER_AUTH_SECRET: 'test-secret-test-secret-test-secret-test-secret',
    LOG_LEVEL: 'silent',
  },
}))

vi.mock('pg', () => ({
  Pool: class {
    on = poolOnMock
    constructor(options: unknown) {
      poolCtorArgs.push(options)
    }
  },
}))

import { logger } from '@utils/logger-util'
import { poolOptions } from '@db/client'

describe('postgres pool idle error handling', () => {
  beforeEach(() => {
    poolOnMock.mockClear()
  })

  it('registers an error handler on the pool', () => {
    expect(typeof captureHandler()).toBe('function')
  })

  it('configures explicit pool limits and timeouts', () => {
    expect(poolOptions.max).toBe(20)
    expect(poolOptions.idleTimeoutMillis).toBe(30_000)
    expect(poolOptions.connectionTimeoutMillis).toBe(5_000)
    expect(poolCtorArgs[0]).toMatchObject({
      max: 20,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    })
  })

  it('logs an idle-client error instead of propagating (does not throw)', () => {
    const errorSpy = vi
      .spyOn(logger, 'error')
      .mockImplementation(() => undefined)
    const handler = captureHandler()

    expect(() => handler?.(new Error('idle connection reset'))).not.toThrow()
    expect(errorSpy).toHaveBeenCalled()
  })
})
