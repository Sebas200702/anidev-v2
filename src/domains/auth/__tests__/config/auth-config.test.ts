import { afterEach, describe, expect, it, vi } from 'vitest'

const load = async (google: Record<string, string | undefined>) => {
  vi.resetModules()
  vi.doMock('@config/env', () => ({ env: google }))
  return import('@auth/config')
}

afterEach(() => {
  vi.doUnmock('@config/env')
})

describe('isGoogleEnabled', () => {
  it('is true only with both credentials', async () => {
    const both = await load({
      GOOGLE_CLIENT_ID: 'id',
      GOOGLE_CLIENT_SECRET: 's',
    })
    expect(both.isGoogleEnabled()).toBe(true)
    const none = await load({})
    expect(none.isGoogleEnabled()).toBe(false)
  })
})
