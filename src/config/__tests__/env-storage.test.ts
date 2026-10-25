/**
 * Tests for the optional S3 storage variables in {@link module:config/env}.
 *
 * @module config/__tests__/env-storage
 */
import { afterEach, describe, expect, it, vi } from 'vitest'

const baseEnv = {
  DATABASE_URL: 'postgres://user:pass@localhost:5432/anidev',
  REDIS_URL: 'redis://localhost:6379',
  APP_BASE_URL: 'http://localhost:4321',
  BETTER_AUTH_SECRET: 'a'.repeat(32),
  S3_ENDPOINT: '',
  S3_REGION: '',
  S3_BUCKET: '',
  S3_ACCESS_KEY_ID: '',
  S3_SECRET_ACCESS_KEY: '',
  S3_PUBLIC_URL: '',
  S3_FORCE_PATH_STYLE: '',
}

const storageEnv = {
  S3_ENDPOINT: 'http://localhost:9000',
  S3_BUCKET: 'anidev-media',
  S3_ACCESS_KEY_ID: 'anidev',
  S3_SECRET_ACCESS_KEY: 'secret',
  S3_PUBLIC_URL: 'http://localhost:9000/anidev-media',
}

const loadEnv = async (overrides: Record<string, string | undefined> = {}) => {
  vi.resetModules()
  for (const [key, value] of Object.entries({ ...baseEnv, ...overrides })) {
    vi.stubEnv(key, value ?? '')
  }
  return import('@config/env')
}

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('env S3_*', () => {
  it('leaves storage disabled when every variable is empty', async () => {
    const { env } = await loadEnv()
    expect(env.S3_ENDPOINT).toBeUndefined()
    expect(env.S3_FORCE_PATH_STYLE).toBe(true)
  })

  it('accepts the full set with region and path-style defaults', async () => {
    const { env } = await loadEnv(storageEnv)
    expect(env.S3_BUCKET).toBe('anidev-media')
    expect(env.S3_REGION).toBe('auto')
    expect(env.S3_FORCE_PATH_STYLE).toBe(true)
  })

  it('parses S3_FORCE_PATH_STYLE=false for R2', async () => {
    const { env } = await loadEnv({
      ...storageEnv,
      S3_REGION: 'auto',
      S3_FORCE_PATH_STYLE: 'false',
    })
    expect(env.S3_FORCE_PATH_STYLE).toBe(false)
  })

  it.each(Object.keys(storageEnv))(
    'fails fast when only %s is missing',
    async (key) => {
      await expect(
        loadEnv({ ...storageEnv, [key]: undefined })
      ).rejects.toThrow()
    }
  )

  it('fails fast when S3_PUBLIC_URL is not a URL', async () => {
    await expect(
      loadEnv({ ...storageEnv, S3_PUBLIC_URL: 'bucket' })
    ).rejects.toThrow()
  })
})
