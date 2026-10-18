/**
 * Unit tests for {@link animeEpisodesRepository}.
 *
 * @module domains/anime/__tests__/repositories/anime-episodes-repository
 * @remarks
 * The Drizzle client is a chainable stub: covers the page/count/detail success shapes (count
 * fallback to `0`, `undefined` for a missing episode) and the `dbError` catch branches. Ordering
 * and pagination SQL are proven by the integration spec.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { InfraError } from '@shared/errors/app-error'
import {
  chainResolving,
  throwOnQuery,
} from '@shared/__tests__/helpers/drizzle-mock'

vi.mock('@config/env', () => ({
  env: { NODE_ENV: 'test', LOG_LEVEL: 'silent' },
}))

const { select } = vi.hoisted(() => ({ select: vi.fn() }))
vi.mock('@db/client', () => ({ db: { select } }))

const { animeEpisodesRepository } = await import(
  '@anime/repositories/anime-episodes'
)

beforeEach(() => {
  vi.clearAllMocks()
  select.mockReturnValue(chainResolving([]))
})

describe('animeEpisodesRepository', () => {
  it('returns the rows of a page', async () => {
    select.mockReturnValue(chainResolving([{ number: 1 }, { number: 2 }]))
    const rows = await animeEpisodesRepository.getEpisodesPage({
      malId: 1,
      page: 1,
      limit: 2,
    })
    expect(rows).toEqual([{ number: 1 }, { number: 2 }])
  })

  it('returns the episode count, falling back to 0', async () => {
    select.mockReturnValue(chainResolving([{ count: 26 }]))
    expect(await animeEpisodesRepository.countEpisodes(1)).toBe(26)

    select.mockReturnValue(chainResolving([]))
    expect(await animeEpisodesRepository.countEpisodes(1)).toBe(0)
  })

  it('returns one episode or undefined', async () => {
    select.mockReturnValue(chainResolving([{ number: 5 }]))
    expect(await animeEpisodesRepository.getEpisodeByNumber(1, 5)).toEqual({
      number: 5,
    })

    select.mockReturnValue(chainResolving([]))
    expect(
      await animeEpisodesRepository.getEpisodeByNumber(1, 5)
    ).toBeUndefined()
  })

  it('wraps failures as InfraError', async () => {
    select.mockImplementation(throwOnQuery)
    await expect(
      animeEpisodesRepository.getEpisodesPage({ malId: 1, page: 1, limit: 2 })
    ).rejects.toBeInstanceOf(InfraError)
    await expect(
      animeEpisodesRepository.countEpisodes(1)
    ).rejects.toBeInstanceOf(InfraError)
    await expect(
      animeEpisodesRepository.getEpisodeByNumber(1, 5)
    ).rejects.toBeInstanceOf(InfraError)
  })
})
