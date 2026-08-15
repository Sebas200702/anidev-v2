/**
 * Auth fixtures for API E2E — a per-test authenticated request context.
 *
 * @module e2e/fixtures/auth
 * @remarks
 * `POST /api/auth/register` establishes a Better Auth session and sets the
 * session cookie on the {@link APIRequestContext} cookie jar, so the returned
 * context is authenticated for subsequent requests. Each test gets a **unique
 * throwaway user** (worker index + monotonic counter + timestamp), so
 * parallel workers never collide and no test depends on another's state.
 *
 * This exercises the real session path (middleware → Better Auth → cookie);
 * cookies are never minted by hand.
 */
import { test as base, expect, type APIRequestContext } from '@playwright/test'

/** Credentials of the throwaway user created for a test. */
export interface AuthedUser {
  email: string
  password: string
  name: string
}

interface AuthFixtures {
  authedUser: AuthedUser
  authedRequest: APIRequestContext
}

let userCounter = 0

/** Test object extended with `authedUser` and an authenticated `authedRequest`. */
export const test = base.extend<AuthFixtures>({
  // biome-ignore lint/correctness/noEmptyPattern: Playwright parses the fixture signature; a no-dependency fixture must use an empty destructure.
  authedUser: async ({}, use, testInfo) => {
    userCounter += 1
    const unique = `${testInfo.workerIndex}-${userCounter}-${Date.now()}`
    await use({
      email: `e2e-${unique}@example.test`,
      password: 'e2e-password-1234',
      name: `E2E User ${unique}`,
    })
  },

  authedRequest: async ({ playwright, baseURL, authedUser }, use) => {
    // A dedicated context does NOT inherit the project's `extraHTTPHeaders`, so
    // re-pin them here — notably `origin`, which Astro's `checkOrigin` CSRF guard
    // requires on mutating requests (DELETE) or it responds 403 before auth.
    const context = await playwright.request.newContext({
      baseURL,
      extraHTTPHeaders: {
        accept: 'application/json',
        ...(baseURL ? { origin: baseURL } : {}),
      },
    })
    const response = await context.post('/api/auth/register', {
      data: authedUser,
    })
    expect(
      response.ok(),
      `register should establish a session (got ${response.status()})`
    ).toBeTruthy()

    await use(context)
    await context.dispose()
  },
})

export { expect }
