/**
 * Tests that the Redis client configured with `lazyConnect` + disabled offline
 * queue connects at bootstrap, so the first operation is not always degraded.
 *
 * @remarks
 * In `ioredis` v5, a `lazyConnect` client only opens the socket when the first
 * command arrives; with `enableOfflineQueue: false` that synchronous command is
 * rejected while status is still `wait`. Issue #82: the first `cacheGet` always
 * degrades. Fix: issue `connect()` eagerly at module load so status reaches
 * `ready` before traffic, and register an `error` listener so a dropped idle
 * socket cannot crash the process.
 *
 * @module lib/cache/__tests__/client
 */
import { describe, expect, it, vi } from 'vitest'

const { RedisMock, connectSpy, onSpy, instances } = vi.hoisted(() => {
  const connectSpy = vi.fn(() => Promise.resolve('OK'))
  const onSpy = vi.fn()
  const instances: unknown[] = []

  class RedisMock {
    on = onSpy
    connect = connectSpy
    constructor() {
      instances.push(this)
    }
  }

  return { RedisMock, connectSpy, onSpy, instances }
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

vi.mock('ioredis', () => ({ Redis: RedisMock }))

import '@lib/cache/client'

describe('redis client bootstrap', () => {
  it('connects eagerly so the first cache operation is not degraded', () => {
    expect(connectSpy).toHaveBeenCalled()
  })

  it('registers an error listener to avoid an unhandled crash', () => {
    const hasErrorHandler = onSpy.mock.calls.some(
      ([event, handler]) => event === 'error' && typeof handler === 'function'
    )
    expect(hasErrorHandler).toBe(true)
  })

  it('constructs a Redis instance at module load', () => {
    expect(instances.length).toBeGreaterThan(0)
  })
})
