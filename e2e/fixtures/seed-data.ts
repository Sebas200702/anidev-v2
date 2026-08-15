/**
 * Canonical E2E seed dataset — the single source of truth shared by the seed
 * script and the specs, so assertions always match what was inserted.
 *
 * @module e2e/fixtures/seed-data
 * @remarks
 * Ids live in a high, reserved range (`999_000_xxx`) that real MAL data never
 * uses, so upserts are safe against both a fresh CI database and the developer's
 * populated local database.
 */

/** A deterministic anime row (only `malId`/`title` are required by the schema). */
export interface SeedAnime {
  malId: number
  title: string
  type: string
  status: string
  score: number
  year: number
  season: string | null
  rating: string | null
}

/** Distinctive substring both seeded anime share — used as the search `query`. */
export const SEED_ANIME_QUERY = 'E2E Seed Anime'

/** Primary seeded anime id, asserted directly in list/search specs. */
export const SEED_ANIME_MAL_ID = 999_000_001

export const SEED_ANIME: SeedAnime[] = [
  {
    malId: SEED_ANIME_MAL_ID,
    title: 'E2E Seed Anime Alpha',
    type: 'TV',
    status: 'Finished Airing',
    score: 8.5,
    year: 2020,
    season: 'spring',
    rating: null,
  },
  {
    malId: 999_000_002,
    title: 'E2E Seed Anime Beta',
    type: 'Movie',
    status: 'Finished Airing',
    score: 7.1,
    year: 2021,
    season: null,
    rating: null,
  },
]

/** A minimal music row (schema requires `id` + `type`). */
export interface SeedMusic {
  id: number
  title: string
  type: string
}

export const SEED_MUSIC: SeedMusic[] = [
  { id: 999_000_001, title: 'E2E Seed Song', type: 'opening' },
]
