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

const { characterSearchRepository } = await import(
  '@people/repositories/character-search'
)
const { characterProfileRepository } = await import(
  '@people/repositories/character-profile'
)
const { characterAppearancesRepository } = await import(
  '@people/repositories/character-appearances'
)
const { PgDialect } = await import('drizzle-orm/pg-core')

const lastSql = () => new PgDialect().sqlToQuery(execute.mock.calls.at(-1)?.[0])

beforeEach(() => {
  vi.clearAllMocks()
})

describe('characterSearchRepository', () => {
  it('returns rows and counts', async () => {
    select.mockReturnValue(chainResolving([{ malId: 1 }]))
    expect(
      await characterSearchRepository.search({ query: 'ab', page: 1, limit: 5 })
    ).toHaveLength(1)
    select.mockReturnValue(chainResolving([{ value: 4 }]))
    expect(await characterSearchRepository.count('ab')).toBe(4)
    select.mockReturnValue(chainResolving([]))
    expect(await characterSearchRepository.count('ab')).toBe(0)
  })
})

describe('characterProfileRepository', () => {
  it('returns the row or undefined, and the voices', async () => {
    select.mockReturnValue(chainResolving([]))
    expect(await characterProfileRepository.getCharacter(1)).toBeUndefined()
    select.mockReturnValue(chainResolving([{ language: 'Japanese' }]))
    expect(await characterProfileRepository.getVoiceActors(1)).toHaveLength(1)
  })
})

describe('characterAppearancesRepository', () => {
  it('pages with bound values and dedupes per work', async () => {
    execute.mockResolvedValue({ rows: [] })
    await characterAppearancesRepository.getAppearances(7, {
      page: 3,
      limit: 10,
    })
    const { sql, params } = lastSql()
    expect(sql).toContain('DISTINCT ON (medium, "malId")')
    expect(params).toEqual(expect.arrayContaining([7, 10, 20, 'Rx - Hentai']))
  })

  it('counts with a default of 0', async () => {
    execute.mockResolvedValue({ rows: [] })
    expect(await characterAppearancesRepository.count(7)).toBe(0)
  })
})

describe('error wrapping', () => {
  it('wraps every query failure as InfraError', async () => {
    select.mockImplementation(throwOnQuery)
    execute.mockRejectedValue(new Error('boom'))
    const calls = [
      characterSearchRepository.search({ query: 'ab', page: 1, limit: 1 }),
      characterSearchRepository.count('ab'),
      characterProfileRepository.getCharacter(1),
      characterProfileRepository.getVoiceActors(1),
      characterAppearancesRepository.getAppearances(1, { page: 1, limit: 1 }),
      characterAppearancesRepository.count(1),
    ]
    for (const call of calls) {
      await expect(call).rejects.toBeInstanceOf(InfraError)
    }
  })
})
