/**
 * Tests for the public readiness route.
 *
 * @module pages/api/health/__tests__/readiness
 * @remarks
 * `@config/env` is mocked (eager validation; the runner does not load `.env`).
 * `@db/client` and `@lib/cache/cache-primitives` are mocked so probes can be
 * driven to `'ok'`/`'down'` deterministically. The route under test is the raw
 * `GET` handler invoked with a minimal `APIContext`.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@config/env', () => ({
  env: {
    NODE_ENV: 'production',
    LOG_LEVEL: 'info',
    DATABASE_URL: 'postgres://test:test@localhost:5432/test',
    REDIS_URL: 'redis://localhost:6379',
  },
}))

vi.mock('@sentry/node', () => ({
  captureException: vi.fn(),
}))

const { executeMock } = vi.hoisted(() => ({
  executeMock: vi.fn(),
}))

const { getMock, setMock, delMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
  setMock: vi.fn(),
  delMock: vi.fn(),
}))

vi.mock('@db/client', () => ({
  db: { execute: executeMock },
}))

vi.mock('@lib/cache/cache-primitives', () => ({
  cacheGet: getMock,
  cacheSet: setMock,
  cacheDel: delMock,
}))

import { GET, probeCache, probeDatabase } from '../readiness'
import { isPublicRoute } from '@config/public-routes'

const createContext = () =>
  ({
    request: new Request('http://localhost:4321/api/health/readiness'),
    params: {},
  }) as Parameters<typeof GET>[0]

beforeEach(() => {
  vi.clearAllMocks()
})

describe('readiness probes', () => {
  it('probeDatabase reports ok when SELECT 1 succeeds', async () => {
    executeMock.mockResolvedValue([])

    await expect(probeDatabase()).resolves.toBe(true)
  })

  it('probeDatabase reports down without throwing when the query fails', async () => {
    executeMock.mockRejectedValue(new Error('connection refused'))

    await expect(probeDatabase()).resolves.toBe(false)
  })

  it('probeCache reports ok on a successful SET+GET round trip', async () => {
    setMock.mockResolvedValue(undefined)
    getMock.mockResolvedValue('pong')
    delMock.mockResolvedValue(undefined)

    await expect(probeCache()).resolves.toBe(true)
  })

  it('probeCache reports down without throwing when the round trip misses', async () => {
    setMock.mockResolvedValue(undefined)
    getMock.mockResolvedValue(null)

    await expect(probeCache()).resolves.toBe(false)
  })
})

describe('GET /api/health/readiness', () => {
  it('responds 200 with both dependencies healthy', async () => {
    executeMock.mockResolvedValue([])
    setMock.mockResolvedValue(undefined)
    getMock.mockResolvedValue('pong')
    delMock.mockResolvedValue(undefined)

    const response = await GET(createContext())

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      status: 200,
      data: { db: 'ok', cache: 'ok' },
    })
  })

  it('responds 503 and lists the database as down', async () => {
    executeMock.mockRejectedValue(new Error('down'))
    setMock.mockResolvedValue(undefined)
    getMock.mockResolvedValue('pong')

    const response = await GET(createContext())

    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toMatchObject({
      data: { db: 'down', cache: 'ok' },
    })
  })

  it('responds 503 and lists the cache as down', async () => {
    executeMock.mockResolvedValue([])
    setMock.mockResolvedValue(undefined)
    getMock.mockResolvedValue(null)

    const response = await GET(createContext())

    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toMatchObject({
      data: { db: 'ok', cache: 'down' },
    })
  })

  it('responds 503 when both dependencies are down', async () => {
    executeMock.mockRejectedValue(new Error('down'))
    setMock.mockResolvedValue(undefined)
    getMock.mockResolvedValue(null)

    const response = await GET(createContext())

    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toMatchObject({
      data: { db: 'down', cache: 'down' },
    })
  })
})

describe('readiness route visibility', () => {
  it('is public via the /api/health prefix without auth', () => {
    expect(isPublicRoute('/api/health/readiness')).toBe(true)
  })
})
