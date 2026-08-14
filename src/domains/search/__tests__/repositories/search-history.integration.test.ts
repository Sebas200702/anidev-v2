/**
 * Integration tests for the search-history repository against a real Postgres.
 *
 * @module domains/search/__tests__/repositories/search-history.integration
 * @remarks
 * Opt-in: only runs when `RUN_DB_TESTS` is set and `DATABASE_URL` points at a
 * reachable Postgres with the `search_history` migration applied. Manages a
 * throwaway user (cascade-cleans history on delete).
 *
 * Run locally: `RUN_DB_TESTS=1 bun run vitest run search-history.integration`
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Pool as PoolType } from 'pg'

const enabled = !!process.env.RUN_DB_TESTS
const TEST_USER = 'test-search-history-user'

describe.skipIf(!enabled)('searchHistoryRepository (integration)', () => {
  let repo: typeof import('@search/repositories/search-history')['searchHistoryRepository']
  let pool: PoolType

  beforeAll(async () => {
    await import('dotenv/config')
    const { Pool } = await import('pg')
    pool = new Pool({ connectionString: process.env.DATABASE_URL })
    await pool.query(
      `insert into "user" (id, name, email, email_verified, created_at, updated_at)
       values ($1, 'Test', 'sh-test@example.com', false, now(), now())
       on conflict (id) do nothing`,
      [TEST_USER]
    )
    const mod = await import('@search/repositories/search-history')
    repo = mod.searchHistoryRepository
    await repo.clearByUser(TEST_USER)
  })

  afterAll(async () => {
    // Cascade removes the user's search_history rows.
    await pool.query('delete from "user" where id = $1', [TEST_USER])
    await pool.end()
  })

  it('records, lists newest-first, and caps rows per user', async () => {
    for (let i = 0; i < 55; i++) {
      await repo.record({
        userId: TEST_USER,
        scope: 'anime',
        query: `q${i}`,
        filters: { i },
      })
    }

    const rows = await repo.listByUser(TEST_USER, 100)
    expect(rows.length).toBe(50)
    expect(rows[0].query).toBe('q54')
    expect(rows[0].scope).toBe('anime')
  })

  it('clears all rows for the user', async () => {
    const removed = await repo.clearByUser(TEST_USER)
    expect(removed).toBeGreaterThan(0)
    expect((await repo.listByUser(TEST_USER, 10)).length).toBe(0)
  })
})
