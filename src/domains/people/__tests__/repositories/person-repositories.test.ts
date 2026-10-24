import { beforeEach, describe, expect, it, vi } from 'vitest'
import { InfraError } from '@shared/errors/app-error'
import {
  chainResolving,
  throwOnQuery,
} from '@shared/__tests__/helpers/drizzle-mock'

vi.mock('@config/env', () => ({
  env: {
    NODE_ENV: 'test',
    LOG_LEVEL: 'silent',
    DATABASE_URL: 'postgres://test:test@localhost:5432/test',
  },
}))

const { select, execute } = vi.hoisted(() => ({
  select: vi.fn(),
  execute: vi.fn(),
}))
vi.mock('@db/client', () => ({ db: { select, execute } }))

const { personSearchRepository } = await import(
  '@people/repositories/person-search'
)
const { personProfileRepository } = await import(
  '@people/repositories/person-profile'
)
const { personVoicesRepository } = await import(
  '@people/repositories/person-voices'
)
const { personCreditsRepository } = await import(
  '@people/repositories/person-credits'
)
const { PgDialect } = await import('drizzle-orm/pg-core')

const lastSql = () => new PgDialect().sqlToQuery(execute.mock.calls.at(-1)?.[0])

beforeEach(() => {
  vi.clearAllMocks()
})

describe('person repositories', () => {
  it('searches and counts', async () => {
    select.mockReturnValue(chainResolving([{ malId: 1 }]))
    expect(
      await personSearchRepository.search({ query: 'ka', page: 1, limit: 5 })
    ).toHaveLength(1)
    select.mockReturnValue(chainResolving([]))
    expect(await personSearchRepository.count('ka')).toBe(0)
  })

  it('returns the profile row and zero counts by default', async () => {
    select.mockReturnValue(chainResolving([]))
    expect(await personProfileRepository.getPerson(1)).toBeUndefined()
    execute.mockResolvedValue({ rows: [] })
    expect(await personProfileRepository.getCounts(1)).toEqual({
      voices: 0,
      animeCredits: 0,
      mangaCredits: 0,
      music: 0,
    })
  })

  it('binds the voice language filter', async () => {
    execute.mockResolvedValue({ rows: [] })
    await personVoicesRepository.getVoices(5, {
      page: 1,
      limit: 10,
      language: 'English',
    })
    expect(lastSql().params).toEqual(expect.arrayContaining([5, 'English']))
  })

  it('groups manga credits from manga_staff', async () => {
    execute.mockResolvedValue({ rows: [] })
    await personCreditsRepository.getCredits(5, {
      medium: 'manga',
      page: 1,
      limit: 10,
    })
    expect(lastSql().sql).toContain('manga_staff')
    execute.mockResolvedValue({ rows: [{ id: 3 }] })
    expect(await personCreditsRepository.getArtistIds(5)).toEqual([3])
  })

  it('wraps every query failure as InfraError', async () => {
    select.mockImplementation(throwOnQuery)
    execute.mockRejectedValue(new Error('boom'))
    const page = { page: 1, limit: 1 }
    const results = await Promise.allSettled([
      personSearchRepository.search({ query: 'ka', ...page }),
      personSearchRepository.count('ka'),
      personProfileRepository.getPerson(1),
      personProfileRepository.getCounts(1),
      personVoicesRepository.getVoices(1, page),
      personVoicesRepository.count(1),
      personCreditsRepository.getCredits(1, { medium: 'anime', ...page }),
      personCreditsRepository.count(1, 'anime'),
      personCreditsRepository.getArtistIds(1),
    ])
    expect(
      results.every(
        (r) => r.status === 'rejected' && r.reason instanceof InfraError
      )
    ).toBe(true)
  })
})
