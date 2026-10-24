/**
 * Integration tests for the producer repositories against a real Postgres.
 *
 * @module domains/producer/__tests__/repositories/producer.integration
 * @remarks Opt-in (`RUN_DB_TESTS`); seeds and removes its own probe rows.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Pool as PgPool } from 'pg'

const PRODUCER_ID = 999_008_001
const ANIME_IDS = [999_008_011, 999_008_012]
const ALT_TITLE = 'Zqxw Probe Studio Alias'

const enabled = !!process.env.RUN_DB_TESTS

describe.skipIf(!enabled)('producer repositories (integration)', () => {
  let pool: PgPool
  let repos: typeof import('@producer/repositories')

  beforeAll(async () => {
    await import('dotenv/config')
    repos = await import('@producer/repositories')
    const { Pool } = await import('pg')
    pool = new Pool({ connectionString: process.env.DATABASE_URL })

    await pool.query(
      `INSERT INTO producer (mal_id, established) VALUES ($1, '2001-01-01')
       ON CONFLICT DO NOTHING`,
      [PRODUCER_ID]
    )
    await pool.query(
      `INSERT INTO producer_title (producer_id, type, title)
       VALUES ($1,'Default','Probe Studio'),($1,'Synonym',$2)
       ON CONFLICT DO NOTHING`,
      [PRODUCER_ID, ALT_TITLE]
    )
    await pool.query(
      `INSERT INTO anime (mal_id, title, type) VALUES ($1,'P1','TV'),($2,'P2','TV')
       ON CONFLICT (mal_id) DO NOTHING`,
      ANIME_IDS
    )
    await pool.query(
      `INSERT INTO anime_producer (anime_id, producer_id, role)
       VALUES ($1,$3,'studio'),($2,$3,'studio'),($2,$3,'producer')
       ON CONFLICT DO NOTHING`,
      [...ANIME_IDS, PRODUCER_ID]
    )
  })

  afterAll(async () => {
    await pool.query('DELETE FROM anime WHERE mal_id = ANY($1)', [ANIME_IDS])
    await pool.query('DELETE FROM producer WHERE mal_id = $1', [PRODUCER_ID])
    await pool.end()
  })

  it('finds the producer by an alternative title with its role count', async () => {
    const rows = await repos.producerListRepository.getProducers({
      page: 1,
      limit: 10,
      sort: 'works',
      role: 'studio',
      query: 'zqxw probe',
    })
    expect(rows).toEqual([
      { malId: PRODUCER_ID, name: 'Probe Studio', works: 2 },
    ])
    expect(
      await repos.producerListRepository.countProducers({
        page: 1,
        limit: 10,
        sort: 'works',
        query: 'zqxw probe',
      })
    ).toBe(1)
  })

  it('excludes producers without credits in the requested role', async () => {
    const rows = await repos.producerListRepository.getProducers({
      page: 1,
      limit: 10,
      sort: 'works',
      role: 'licensor',
      query: 'zqxw probe',
    })
    expect(rows).toEqual([])
  })

  it('loads titles (Default first) and credit counts per role', async () => {
    const { producerDetailsRepository } = repos
    expect(
      (await producerDetailsRepository.getTitles(PRODUCER_ID))[0].type
    ).toBe('Default')
    const counts = await producerDetailsRepository.getCreditCounts(PRODUCER_ID)
    expect(Object.fromEntries(counts.map((c) => [c.role, c.works]))).toEqual({
      studio: 2,
      producer: 1,
    })
  })

  it('returns undefined for an unknown producer', async () => {
    expect(
      await repos.producerDetailsRepository.getProducer(PRODUCER_ID + 1)
    ).toBeUndefined()
  })
})
