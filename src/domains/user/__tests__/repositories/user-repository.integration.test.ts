/**
 * Integration tests for the user repository against a real Postgres.
 *
 * @module domains/user/__tests__/repositories/user-repository.integration
 * @remarks
 * Opt-in (`RUN_DB_TESTS`). Seeds a Better Auth `user` row (required by the `profile` FK), then
 * exercises create/read/update through the repository and cleans up in `afterAll`. Validates the
 * real `INSERT ... ON CONFLICT`, `SELECT`, and `UPDATE ... RETURNING` that the unit tests mock.
 *
 * Run locally: `RUN_DB_TESTS=1 bun run vitest run user-repository.integration`
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Pool as PgPool } from 'pg'

const enabled = !!process.env.RUN_DB_TESTS

const UID = 'e2e-user-999-002'

describe.skipIf(!enabled)('userRepository (integration)', () => {
  let pool: PgPool
  let userRepository: typeof import('@user/repositories/user')['userRepository']
  // The migration declares `profile.user_id` as `text`; a drifted local DB may still
  // have the legacy `integer` column, which cannot hold Better Auth string ids. Detect
  // it and skip (rather than fail confusingly) — CI runs against a freshly migrated DB.
  let schemaDrift = false

  beforeAll(async () => {
    await import('dotenv/config')
    const { Pool } = await import('pg')
    pool = new Pool({ connectionString: process.env.DATABASE_URL })

    const { rows } = await pool.query(
      `SELECT data_type FROM information_schema.columns
       WHERE table_name = 'profile' AND column_name = 'user_id'`
    )
    if (rows[0]?.data_type !== 'text') {
      schemaDrift = true
      return
    }

    // Clean any leftovers, then seed the FK parent user.
    await pool.query('DELETE FROM profile WHERE id = $1', [UID])
    await pool.query('DELETE FROM "user" WHERE id = $1', [UID])
    await pool.query(
      `INSERT INTO "user" (id, name, email, email_verified)
       VALUES ($1,'E2E User','e2e-user-999-002@example.test',true)`,
      [UID]
    )

    userRepository = (await import('@user/repositories/user')).userRepository
  })

  afterAll(async () => {
    if (!pool) return
    if (!schemaDrift) {
      await pool.query('DELETE FROM profile WHERE id = $1', [UID])
      await pool.query('DELETE FROM "user" WHERE id = $1', [UID])
    }
    await pool.end()
  })

  it('creates, reads, and updates a profile', async (ctx) => {
    if (schemaDrift) ctx.skip()
    const created = await userRepository.createProfile({
      id: UID,
      userId: UID,
      name: 'Alice',
      lastName: 'Smith',
    } as never)
    expect(created).toMatchObject({ id: UID, name: 'Alice' })

    const read = await userRepository.getUserProfileById(UID)
    expect(read).toMatchObject({ id: UID, lastName: 'Smith' })

    const updated = await userRepository.updateProfile(UID, { name: 'Alicia' })
    expect(updated).toMatchObject({ id: UID, name: 'Alicia' })
  })

  it('is a no-op insert when the profile already exists', async (ctx) => {
    if (schemaDrift) ctx.skip()
    const again = await userRepository.createProfile({
      id: UID,
      userId: UID,
      name: 'Dup',
      lastName: 'Dup',
    } as never)
    // onConflictDoNothing → no row returned on conflict.
    expect(again).toBeUndefined()
  })
})
