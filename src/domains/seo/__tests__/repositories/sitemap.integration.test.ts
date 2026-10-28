/**
 * Integration tests for the sitemap repository against a real Postgres.
 *
 * @module domains/seo/__tests__/repositories/sitemap.integration
 * @remarks Opt-in (`RUN_DB_TESTS`); expects `db:migrate` + `db:seed:e2e`.
 */
import { beforeAll, describe, expect, it } from 'vitest'

const enabled = !!process.env.RUN_DB_TESTS

describe.skipIf(!enabled)('sitemap repository (integration)', () => {
  let repo: typeof import('@seo/repositories/sitemap')['sitemapRepository']

  beforeAll(async () => {
    await import('dotenv/config')
    repo = (await import('@seo/repositories/sitemap')).sitemapRepository
  })

  it('never lists an adult-rated anime', async () => {
    const { Pool } = await import('pg')
    const pool = new Pool({ connectionString: process.env.DATABASE_URL })
    const adult = await pool.query(
      `SELECT mal_id FROM anime WHERE rating = 'Rx - Hentai' ORDER BY mal_id LIMIT 1`
    )
    await pool.end()
    expect(adult.rowCount).toBe(1)

    const total = await repo.countAnime()
    const rows = await repo.getAnimePage(0, total)
    expect(rows).toHaveLength(total)
    expect(rows.map((r) => r.malId)).not.toContain(adult.rows[0].mal_id)
  })

  it('orders anime by MAL id', async () => {
    const rows = await repo.getAnimePage(0, 50)
    const ids = rows.map((r) => r.malId)
    expect(ids).toEqual([...ids].sort((a, b) => a - b))
  })

  it('omits adult genres', async () => {
    const names = await repo.getGenreNames()
    expect(names).not.toContain('Hentai')
  })
})
