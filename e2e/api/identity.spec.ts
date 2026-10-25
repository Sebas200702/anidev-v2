/**
 * E2E tests for Fase 2 identity: Google routes, onboarding status and
 * profile preferences, over the real stack.
 *
 * @module e2e/api/identity
 * @remarks
 * CI runs without Google credentials, so the Google routes are asserted in
 * their `PROVIDER_NOT_CONFIGURED` state; the real consent round trip is a
 * manual check (see the change's tasks).
 */
import {
  CATALOG_RATE_LIMIT_IP,
  SEED_ANIME_MAL_ID,
  SEED_GENRE_MAL_ID,
  SEED_PRODUCER_MAL_ID,
} from '../fixtures/seed-data'
import { expect, test } from '../fixtures/auth'

const getSessionData = async (
  request: import('@playwright/test').APIRequestContext
) => (await (await request.get('/api/auth/session')).json()).data

test.describe('Google sign-in without credentials', () => {
  test.use({
    extraHTTPHeaders: {
      accept: 'application/json',
      'x-forwarded-for': CATALOG_RATE_LIMIT_IP,
    },
  })

  test('answers 404 PROVIDER_NOT_CONFIGURED', async ({ request }) => {
    const responses = await Promise.all(
      ['/api/auth/sign-in/google', '/api/auth/callback/google'].map((path) =>
        request.get(path, { maxRedirects: 0 })
      )
    )
    const bodies = await Promise.all(responses.map((res) => res.json()))
    expect(responses.map((res) => res.status())).toEqual([404, 404])
    expect(bodies.map((body) => body.code)).toEqual([
      'PROVIDER_NOT_CONFIGURED',
      'PROVIDER_NOT_CONFIGURED',
    ])
  })

  test('linking requires a session', async ({ request }) => {
    const res = await request.get('/api/auth/link/google', { maxRedirects: 0 })
    expect(res.status()).toBe(401)
  })
})

test.describe('onboarding and preferences', () => {
  test('profileStatus follows the profile and preferences persist', async ({
    authedRequest,
  }) => {
    const before = await getSessionData(authedRequest)
    expect(before.profileStatus).toBe('missing')
    const userId = before.user.id

    await authedRequest.post('/api/user', {
      data: { name: 'Ada', lastName: 'Lovelace', gender: 'female' },
    })
    expect((await getSessionData(authedRequest)).profileStatus).toBe(
      'incomplete'
    )

    const saved = await authedRequest.patch(`/api/user/${userId}/preferences`, {
      data: {
        fanaticLevel: 'high',
        favoriteGenres: [SEED_GENRE_MAL_ID],
        favoriteStudios: [SEED_PRODUCER_MAL_ID],
        favoriteAnimes: [SEED_ANIME_MAL_ID],
      },
    })
    expect(saved.status()).toBe(200)
    expect((await saved.json()).data.preferences).toMatchObject({
      fanaticLevel: 'high',
      favoriteGenres: [SEED_GENRE_MAL_ID],
      favoriteStudios: [SEED_PRODUCER_MAL_ID],
      favoriteAnimes: [SEED_ANIME_MAL_ID],
    })

    const read = await (await authedRequest.get(`/api/user/${userId}`)).json()
    expect(read.data.preferences.fanaticLevel).toBe('high')
  })

  test('rejects unknown catalog ids and other users', async ({
    authedRequest,
  }) => {
    const { user } = await getSessionData(authedRequest)
    await authedRequest.post('/api/user', {
      data: { name: 'Ada', lastName: 'Lovelace', gender: 'female' },
    })

    const unknown = await authedRequest.patch(
      `/api/user/${user.id}/preferences`,
      {
        data: { favoriteStudios: [2_147_480_000] },
      }
    )
    expect(unknown.status()).toBe(400)

    const other = await authedRequest.patch(
      '/api/user/someone-else-entirely/preferences',
      { data: { frequency: 'daily' } }
    )
    expect(other.status()).toBe(403)
  })
})
