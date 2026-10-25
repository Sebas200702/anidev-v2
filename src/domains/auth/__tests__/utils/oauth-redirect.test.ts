import { describe, expect, it, vi } from 'vitest'

vi.mock('@config/env', () => ({
  env: { NODE_ENV: 'test', LOG_LEVEL: 'silent' },
}))

const {
  mapCallbackRedirect,
  providerNotConfigured,
  toRedirect,
  withOAuthErrors,
} = await import('@auth/utils/oauth-redirect')

const jsonWithCookie = (body: unknown) => {
  const headers = new Headers({ 'Content-Type': 'application/json' })
  headers.append('Set-Cookie', 'state=abc; Path=/; HttpOnly')
  return new Response(JSON.stringify(body), { headers })
}

describe('toRedirect', () => {
  it('redirects to the provider url and keeps the state cookie', async () => {
    const res = await toRedirect(
      jsonWithCookie({ url: 'https://accounts.google.com/o/oauth2' }),
      'https://app/x'
    )
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe(
      'https://accounts.google.com/o/oauth2'
    )
    expect(res.headers.getSetCookie()).toEqual(['state=abc; Path=/; HttpOnly'])
  })

  it('falls back when the url is empty (already linked)', async () => {
    const res = await toRedirect(jsonWithCookie({ url: '' }), 'https://app/x')
    expect(res.headers.get('location')).toBe('https://app/x')
  })
})

describe('mapCallbackRedirect', () => {
  it('rewrites the not-linked error into ours', () => {
    const res = mapCallbackRedirect(
      new Response(null, {
        status: 302,
        headers: { Location: 'https://app/login?error=account_not_linked' },
      })
    )
    expect(res.headers.get('location')).toBe(
      'https://app/login?error=ACCOUNT_EXISTS_USE_PASSWORD'
    )
  })

  it('passes other responses through untouched', () => {
    const original = new Response(null, {
      status: 302,
      headers: { Location: 'https://app/profile' },
    })
    expect(mapCallbackRedirect(original)).toBe(original)
  })
})

describe('withOAuthErrors', () => {
  it('maps a thrown error to the JSON envelope', async () => {
    const res = await withOAuthErrors(() =>
      Promise.reject(providerNotConfigured('google'))
    )
    expect(res.status).toBe(404)
    expect((await res.json()).code).toBe('PROVIDER_NOT_CONFIGURED')
  })
})
