import { afterEach, describe, expect, it, vi } from 'vitest'

const load = async (storage: Record<string, string | undefined>) => {
  vi.resetModules()
  vi.doMock('@config/env', () => ({ env: storage }))
  return import('@lib/storage/config')
}

afterEach(() => {
  vi.doUnmock('@config/env')
})

describe('isStorageEnabled', () => {
  it('is true once the storage set is configured', async () => {
    const enabled = await load({
      S3_ENDPOINT: 'http://localhost:9000',
      S3_BUCKET: 'anidev-media',
      S3_ACCESS_KEY_ID: 'anidev',
      S3_SECRET_ACCESS_KEY: 'secret',
      S3_PUBLIC_URL: 'http://localhost:9000/anidev-media',
    })
    expect(enabled.isStorageEnabled()).toBe(true)
  })

  it('is false without storage env', async () => {
    const disabled = await load({})
    expect(disabled.isStorageEnabled()).toBe(false)
  })
})
