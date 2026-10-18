/**
 * Unit tests for the anime episode request/response schemas.
 *
 * @module domains/anime/__tests__/schemas/anime-episode-schema
 * @remarks
 * Pins the pagination bounds and defaults of the list route, the episode-number coercion of the
 * detail route, and the item/detail payload shapes (list items omit the synopsis).
 */
import { describe, expect, it } from 'vitest'
import {
  animeEpisodeDetailSchema,
  animeEpisodeItemSchema,
  getAnimeEpisodeSchema,
  getAnimeEpisodesSchema,
} from '@anime/schemas/anime-episode-schema'

const list = (query: Record<string, unknown>) =>
  getAnimeEpisodesSchema.safeParse({ params: { malId: '1' }, query })

describe('getAnimeEpisodesSchema', () => {
  it('defaults page to 1 and limit to 24, coercing malId', () => {
    const parsed = getAnimeEpisodesSchema.parse({ params: { malId: '1' } })
    expect(parsed.params.malId).toBe(1)
    expect(parsed.query).toEqual({ page: 1, limit: 24 })
  })

  it('coerces numeric page and limit strings', () => {
    const parsed = list({ page: '3', limit: '50' })
    expect(parsed.success && parsed.data.query).toEqual({ page: 3, limit: 50 })
  })

  it.each([
    { page: '0' },
    { page: '10001' },
    { page: '1.5' },
    { limit: '0' },
    { limit: '101' },
    { limit: 'abc' },
  ])('rejects out-of-range pagination %o', (query) => {
    expect(list(query).success).toBe(false)
  })

  it('rejects a non-positive malId', () => {
    const parsed = getAnimeEpisodesSchema.safeParse({ params: { malId: '0' } })
    expect(parsed.success).toBe(false)
  })
})

describe('getAnimeEpisodeSchema', () => {
  it('coerces malId and episode number', () => {
    const parsed = getAnimeEpisodeSchema.parse({
      params: { malId: '1', number: '12' },
    })
    expect(parsed.params).toEqual({ malId: 1, number: 12 })
  })

  it('rejects a non-integer episode number', () => {
    const parsed = getAnimeEpisodeSchema.safeParse({
      params: { malId: '1', number: 'abc' },
    })
    expect(parsed.success).toBe(false)
  })
})

describe('episode payload schemas', () => {
  const base = {
    id: 10,
    number: 1,
    title: 'Asteroid Blues',
    duration: '25 min',
    aired: '1998-10-23',
  }

  it('accepts a list item with nullable duration/aired', () => {
    const parsed = animeEpisodeItemSchema.parse({
      ...base,
      duration: null,
      aired: null,
    })
    expect(parsed.duration).toBeNull()
  })

  it('strips the synopsis from list items', () => {
    const parsed = animeEpisodeItemSchema.parse({ ...base, synopsis: 'x' })
    expect(parsed).not.toHaveProperty('synopsis')
  })

  it('requires the synopsis key on the detail payload', () => {
    expect(animeEpisodeDetailSchema.safeParse(base).success).toBe(false)
    expect(
      animeEpisodeDetailSchema.safeParse({ ...base, synopsis: null }).success
    ).toBe(true)
  })
})
