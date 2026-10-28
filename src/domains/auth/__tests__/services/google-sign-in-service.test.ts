import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@config/env', () => ({
  env: {
    NODE_ENV: 'test',
    LOG_LEVEL: 'silent',
    APP_BASE_URL: 'https://anidev.example',
  },
}))

const m = vi.hoisted(() => ({
  enabled: vi.fn(),
  signInSocial: vi.fn(),
  linkSocialAccount: vi.fn(),
  handler: vi.fn(),
}))
vi.mock('@auth/config', () => ({ isGoogleEnabled: m.enabled }))
vi.mock('@lib/auth/server', () => ({
  auth: {
    api: {
      signInSocial: m.signInSocial,
      linkSocialAccount: m.linkSocialAccount,
    },
    handler: m.handler,
  },
}))

const { googleSignInService } = await import('@auth/services/google-sign-in')

const json = (body: unknown) => new Response(JSON.stringify(body))
const req = (path: string) => new Request(`https://anidev.example${path}`)

beforeEach(() => {
  vi.clearAllMocks()
  m.enabled.mockReturnValue(true)
  m.signInSocial.mockResolvedValue(
    json({ url: 'https://accounts.google.com/x' })
  )
  m.linkSocialAccount.mockResolvedValue(json({ url: '' }))
})

describe('googleSignInService', () => {
  it('starts sign-in with a sanitized absolute destination', async () => {
    const res = await googleSignInService.start(
      req('/api/auth/sign-in/google?callbackURL=//evil.example')
    )
    expect(res.status).toBe(302)
    expect(m.signInSocial).toHaveBeenCalledWith(
      expect.objectContaining({
        body: {
          provider: 'google',
          callbackURL: 'https://anidev.example/',
          errorCallbackURL: 'https://anidev.example/',
        },
        asResponse: true,
      })
    )
  })

  it('keeps a same-site callback path', async () => {
    await googleSignInService.start(
      req('/api/auth/sign-in/google?callbackURL=/profile')
    )
    expect(m.signInSocial.mock.calls[0][0].body.callbackURL).toBe(
      'https://anidev.example/profile'
    )
  })

  it('rejects every step when Google is not configured', async () => {
    m.enabled.mockReturnValue(false)
    const calls = [
      googleSignInService.start(req('/')),
      googleSignInService.callback(req('/')),
      googleSignInService.link(req('/')),
    ]
    const results = await Promise.allSettled(calls)
    expect(
      results.every(
        (r) =>
          r.status === 'rejected' && r.reason.code === 'PROVIDER_NOT_CONFIGURED'
      )
    ).toBe(true)
    expect(m.signInSocial).not.toHaveBeenCalled()
  })

  it('maps the callback not-linked error', async () => {
    m.handler.mockResolvedValue(
      new Response(null, {
        status: 302,
        headers: {
          Location: 'https://anidev.example/?error=account_not_linked',
        },
      })
    )
    const res = await googleSignInService.callback(
      req('/api/auth/callback/google')
    )
    expect(res.headers.get('location')).toContain('ACCOUNT_EXISTS_USE_PASSWORD')
  })

  it('links and falls back to the destination when already linked', async () => {
    const res = await googleSignInService.link(
      req('/api/auth/link/google?callbackURL=/settings')
    )
    expect(res.headers.get('location')).toBe('https://anidev.example/settings')
  })
})
