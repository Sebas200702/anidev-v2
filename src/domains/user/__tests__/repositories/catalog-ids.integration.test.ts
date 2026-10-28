/**
 * Integration test for the catalog id existence repository.
 *
 * @module domains/user/__tests__/repositories/catalog-ids.integration
 * @remarks Opt-in (`RUN_DB_TESTS`); expects `db:seed:e2e` (seeded anime and genre).
 */
import { beforeAll, describe, expect, it } from 'vitest'

const enabled = !!process.env.RUN_DB_TESTS

describe.skipIf(!enabled)('catalog ids (integration)', () => {
  let repo: typeof import('@user/repositories/catalog-ids')['catalogIdsRepository']

  beforeAll(async () => {
    await import('dotenv/config')
    repo = (await import('@user/repositories/catalog-ids')).catalogIdsRepository
  })

  it('finds seeded ids and reports unknown ones', async () => {
    const missing = await repo.findMissing({
      animes: [999_000_001, 2_147_480_000],
      genres: [999_000_011],
      studios: [2_147_480_000],
    })
    expect(missing).toEqual({
      animes: [2_147_480_000],
      genres: [],
      studios: [2_147_480_000],
    })
  })
})
