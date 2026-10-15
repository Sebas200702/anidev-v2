/**
 * E2E API tests for the user profile lifecycle.
 *
 * @module e2e/api/user-profile
 * @remarks
 * Drives the authenticated create → public read → owner update flow, plus the cross-user 403 and the
 * unknown-profile 404. Uses the `authedRequest` fixture, which registers a fresh user and returns a
 * cookie-backed context.
 */
import 'dotenv/config'
import { Pool } from 'pg'
import { expect, test } from '../fixtures/auth'

// The migration declares `profile.user_id` as `text`. A drifted local DB may still have
// the legacy `integer` column, which cannot store Better Auth string ids — so profile
// writes/reads fail there. Detect it once and skip (CI runs a freshly migrated DB).
let profileDrift = false
test.beforeAll(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  try {
    const { rows } = await pool.query(
      `SELECT data_type FROM information_schema.columns
       WHERE table_name = 'profile' AND column_name = 'user_id'`
    )
    profileDrift = rows[0]?.data_type !== 'text'
  } finally {
    await pool.end()
  }
})

test.describe('user profile lifecycle', () => {
  test('create, read, and update the caller profile', async ({
    authedRequest,
  }) => {
    // Skip is runtime-conditional (drifted local DB), never unconditional: CI
    // always migrates fresh, so the suite still runs there.
    test.skip(
      // NOSONAR:S1607
      profileDrift,
      'profile.user_id has drifted from text — run against a freshly migrated DB'
    )
    const session = await authedRequest.get('/api/auth/session')
    expect(session.status()).toBe(200)
    const userId = (await session.json()).data.user.id
    expect(typeof userId).toBe('string')

    // Create (authenticated) — profile id is the session user id.
    const created = await authedRequest.post('/api/user', {
      data: { name: 'Alice', lastName: 'Smith', gender: 'female' },
    })
    expect(created.status()).toBe(201)
    expect((await created.json()).data.id).toBe(userId)

    // Public read.
    const read = await authedRequest.get(`/api/user/${userId}`)
    expect(read.status()).toBe(200)
    const readBody = await read.json()
    expect(readBody.data.name).toBe('Alice')
    expect(readBody.data.lastName).toBe('Smith')

    // Owner update.
    const updated = await authedRequest.patch(`/api/user/${userId}`, {
      data: { name: 'Alicia' },
    })
    expect(updated.status()).toBe(200)
    expect((await updated.json()).data.name).toBe('Alicia')
  })

  test('owner sees private sections; others and anonymous do not', async ({
    authedRequest,
    playwright,
    baseURL,
    request,
  }) => {
    test.skip(
      profileDrift,
      'profile.user_id has drifted from text — run against a freshly migrated DB'
    )
    const session = await authedRequest.get('/api/auth/session')
    const userId = (await session.json()).data.user.id

    await authedRequest.post('/api/user', {
      data: { name: 'Private', lastName: 'Owner', gender: 'other' },
    })

    const owner = await (await authedRequest.get(`/api/user/${userId}`)).json()
    expect(owner.data.preferences).toBeDefined()
    expect(owner.data.history).toBeDefined()

    const stranger = await playwright.request.newContext({ baseURL })
    const strangerBody = await (
      await stranger.get(`/api/user/${userId}`)
    ).json()
    expect(strangerBody.data.id).toBe(userId)
    expect(strangerBody.data.preferences).toBeUndefined()
    expect(strangerBody.data.history).toBeUndefined()
    await stranger.dispose()

    const anonymous = await (await request.get(`/api/user/${userId}`)).json()
    expect(anonymous.data.preferences).toBeUndefined()
    expect(anonymous.data.history).toBeUndefined()
  })

  test('editing another user is forbidden (403)', async ({ authedRequest }) => {
    const res = await authedRequest.patch('/api/user/someone-else-entirely', {
      data: { name: 'Nope' },
    })
    expect(res.status()).toBe(403)
  })

  test('reading a non-existent profile is 404', async ({ request }) => {
    // See the create/read/update test: conditional on DB drift, not ignored.
    test.skip(
      // NOSONAR:S1607
      profileDrift,
      'profile.user_id has drifted from text — run against a freshly migrated DB'
    )
    const res = await request.get(`/api/user/e2e-missing-${Date.now()}`)
    expect(res.status()).toBe(404)
    expect((await res.json()).code).toBe('USER_NOT_FOUND')
  })
})
