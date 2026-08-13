/**
 * Integration tests for the anime list repository against a real Postgres.
 *
 * @module domains/anime/__tests__/repositories/anime-list.integration
 * @remarks
 * Opt-in: only runs when `RUN_DB_TESTS` is set and `DATABASE_URL` points at a
 * reachable Postgres with the `pg_trgm` migration applied. Skipped in the default
 * unit gate (no DB) and enabled locally / in a CI service container.
 *
 * Run locally: `RUN_DB_TESTS=1 bun run vitest run anime-list.integration`
 */
import { beforeAll, describe, expect, it } from 'vitest'

const enabled = !!process.env.RUN_DB_TESTS

describe.skipIf(!enabled)('animeListRepository (integration)', () => {
  let getAnimeList: (typeof import('@anime/repositories/anime-list'))['animeListRepository']['getAnimeList']

  beforeAll(async () => {
    await import('dotenv/config')
    const mod = await import('@anime/repositories/anime-list')
    getAnimeList = mod.animeListRepository.getAnimeList
  })

  it('free-text search returns index-backed matches ranked by relevance', async () => {
    const rows = await getAnimeList({
      page: 1,
      limit: 10,
      query: 'cowboy',
      sort: 'relevance',
      order: 'desc',
      parentalVariant: 'full',
    })

    expect(rows.length).toBeGreaterThan(0)
    expect(rows.some((r) => /cowboy bebop/i.test(r.title))).toBe(true)
    // Relevance ranks the closest title first.
    expect(rows[0].title.toLowerCase()).toContain('cowboy bebop')
  })

  it('safe parental variant excludes adult (Rx - Hentai) ratings', async () => {
    const rows = await getAnimeList({
      page: 1,
      limit: 100,
      parentalVariant: 'safe',
    })

    expect(rows.every((r) => r.rating !== 'Rx - Hentai')).toBe(true)
  })
})
