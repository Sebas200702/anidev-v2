/**
 * E2E: Better Auth register/login session mechanics over real HTTP.
 *
 * @module e2e/api/auth-session
 */
import { expect, test } from '@playwright/test'

let counter = 0
const uniqueUser = (workerIndex: number) => {
  counter += 1
  const unique = `${workerIndex}-${counter}-${Date.now()}`
  return {
    email: `e2e-auth-${unique}@example.test`,
    password: 'e2e-password-1234',
    name: `E2E Auth ${unique}`,
  }
}

test.describe('auth session', () => {
  test('register establishes a session accepted by /api/auth/session', async ({
    playwright,
    baseURL,
  }, testInfo) => {
    const context = await playwright.request.newContext({
      baseURL,
      extraHTTPHeaders: {
        'x-forwarded-for': `10.210.${testInfo.workerIndex % 256}.${counter % 256}`,
      },
    })
    const user = uniqueUser(testInfo.workerIndex)

    const register = await context.post('/api/auth/register', { data: user })
    expect(register.ok()).toBeTruthy()

    const session = await context.get('/api/auth/session')
    expect(session.status()).toBe(200)
    expect(JSON.stringify(await session.json())).toContain(user.email)

    await context.dispose()
  })

  test('login issues a working session on a fresh context', async ({
    playwright,
    baseURL,
  }, testInfo) => {
    const user = uniqueUser(testInfo.workerIndex)

    const registerContext = await playwright.request.newContext({
      baseURL,
      extraHTTPHeaders: {
        'x-forwarded-for': `10.211.${testInfo.workerIndex % 256}.${counter % 256}`,
      },
    })
    expect(
      (await registerContext.post('/api/auth/register', { data: user })).ok()
    ).toBeTruthy()
    await registerContext.dispose()

    // Fresh context with no cookies — login must issue its own session.
    const loginContext = await playwright.request.newContext({
      baseURL,
      extraHTTPHeaders: {
        'x-forwarded-for': `10.212.${testInfo.workerIndex % 256}.${counter % 256}`,
      },
    })
    const login = await loginContext.post('/api/auth/login', {
      data: { email: user.email, password: user.password },
    })
    expect(login.ok()).toBeTruthy()

    const session = await loginContext.get('/api/auth/session')
    expect(session.status()).toBe(200)
    expect(JSON.stringify(await session.json())).toContain(user.email)

    await loginContext.dispose()
  })

  test('repeated registration trips the per-IP throttle with 429', async ({
    request,
  }) => {
    const tag = Date.now()
    let lastStatus = 0
    let lastBody: Record<string, unknown> = {}
    let lastHeaders: Record<string, string> = {}
    // AUTH_RATE_LIMIT is 10/min on the shared suite IP (no spoofed header
    // here by design); the 11th rapid registration must be refused.
    for (let i = 0; i < 11; i++) {
      const res = await request.post('/api/auth/register', {
        data: {
          email: `e2e-throttle-${tag}-${i}@example.test`,
          password: 'e2e-password-1234',
          name: `Throttle ${i}`,
        },
      })
      lastStatus = res.status()
      lastHeaders = res.headers()
      lastBody = (await res.json().catch(() => ({}))) as Record<string, unknown>
    }
    expect(lastStatus).toBe(429)
    expect(lastHeaders['retry-after']).toBeDefined()
    expect(lastBody['code']).toBe('RATE_LIMITED')
  })

  test('anonymous request to an authed route is 401', async ({ request }) => {
    const res = await request.get('/api/search-history')
    expect(res.status()).toBe(401)
    expect((await res.json()).code).toBe('AUTH_REQUIRED')
  })
})
