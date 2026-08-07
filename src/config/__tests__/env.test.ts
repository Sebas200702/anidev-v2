/**
 * Tests for environment variable parsing in {@link module:config/env}.
 *
 * @module config/__tests__/env
 * @remarks
 * `src/config/env.ts` validates eagerly at module load. Because the runner does
 * not load `.env`, each test stubs the environment with `vi.stubEnv` (which
 * covers both `process.env` and `import.meta.env`), resets module cache, and
 * re-imports the module to observe the parsed result or thrown Zod error.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'

const baseEnv = {
  NODE_ENV: 'development',
  DATABASE_URL: 'postgres://user:pass@localhost:5432/anidev',
  REDIS_URL: 'redis://localhost:6379',
  SENTRY_DSN: undefined,
  APP_BASE_URL: 'http://localhost:4321',
  BETTER_AUTH_SECRET: 'a'.repeat(32),
  LOG_LEVEL: 'info',
}

async function loadEnv(overrides: Record<string, unknown> = {}) {
  vi.resetModules()
  const full = { ...baseEnv, ...overrides }
  for (const [key, value] of Object.entries(full)) {
    if (value === undefined) {
      vi.stubEnv(key, '')
    } else {
      vi.stubEnv(key, String(value))
    }
  }
  return import('@config/env')
}

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('env DATABASE_URL / REDIS_URL', () => {
  it('parses valid PostgreSQL and Redis URLs', async () => {
    const { env } = await loadEnv()

    expect(env.DATABASE_URL).toBe('postgres://user:pass@localhost:5432/anidev')
    expect(env.REDIS_URL).toBe('redis://localhost:6379')
  })

  it('fails fast when DATABASE_URL is missing', async () => {
    await expect(loadEnv({ DATABASE_URL: undefined })).rejects.toThrow()
  })

  it('fails fast when DATABASE_URL is not a valid URL', async () => {
    await expect(loadEnv({ DATABASE_URL: 'not-a-url' })).rejects.toThrow()
  })

  it('fails fast when REDIS_URL is missing', async () => {
    await expect(loadEnv({ REDIS_URL: undefined })).rejects.toThrow()
  })

  it('fails fast when REDIS_URL is not a valid URL', async () => {
    await expect(loadEnv({ REDIS_URL: 'nope' })).rejects.toThrow()
  })

  it('accepts postgresql: scheme for DATABASE_URL', async () => {
    const { env } = await loadEnv({
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/anidev',
    })

    expect(env.DATABASE_URL).toBe(
      'postgresql://user:pass@localhost:5432/anidev'
    )
  })

  it('accepts rediss: scheme for REDIS_URL', async () => {
    const { env } = await loadEnv({ REDIS_URL: 'rediss://localhost:6379' })

    expect(env.REDIS_URL).toBe('rediss://localhost:6379')
  })

  it.each(['http://localhost:5432/anidev', 'ftp://localhost:5432/anidev'])(
    'rejects unsupported DATABASE_URL scheme %s',
    async (url) => {
      await expect(loadEnv({ DATABASE_URL: url })).rejects.toThrow()
    }
  )

  it.each(['http://localhost:6379', 'ftp://localhost:6379'])(
    'rejects unsupported REDIS_URL scheme %s',
    async (url) => {
      await expect(loadEnv({ REDIS_URL: url })).rejects.toThrow()
    }
  )

  it('rejects a BETTER_AUTH_SECRET shorter than 32 characters', async () => {
    await expect(loadEnv({ BETTER_AUTH_SECRET: 'too-short' })).rejects.toThrow()
  })
})
