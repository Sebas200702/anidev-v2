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

const { producerListRepository, producerDetailsRepository } = await import(
  '@producer/repositories'
)
const { PgDialect } = await import('drizzle-orm/pg-core')

const query = { page: 2, limit: 10, sort: 'works' as const }
const lastSql = () => new PgDialect().sqlToQuery(execute.mock.calls.at(-1)[0])

beforeEach(() => {
  vi.clearAllMocks()
})

describe('producerListRepository', () => {
  it('pages with bound limit/offset and orders by works', async () => {
    execute.mockResolvedValue({ rows: [{ malId: 1, name: 'A', works: 2 }] })
    const rows = await producerListRepository.getProducers(query)
    expect(rows).toHaveLength(1)
    const { sql, params } = lastSql()
    expect(sql).toContain('ORDER BY works DESC')
    expect(params).toEqual(expect.arrayContaining([10, 10]))
  })

  it('binds role and query filters', async () => {
    execute.mockResolvedValue({ rows: [] })
    await producerListRepository.getProducers({
      ...query,
      role: 'studio',
      query: 'bon',
      sort: 'name',
    })
    const { sql, params } = lastSql()
    expect(sql).toContain('ORDER BY n.title ASC')
    expect(params).toEqual(expect.arrayContaining(['studio', '%bon%']))
  })

  it('counts and defaults to 0', async () => {
    execute.mockResolvedValue({ rows: [{ total: 7 }] })
    expect(await producerListRepository.countProducers(query)).toBe(7)
    execute.mockResolvedValue({ rows: [] })
    expect(await producerListRepository.countProducers(query)).toBe(0)
  })

  it('wraps errors', async () => {
    execute.mockRejectedValue(new Error('boom'))
    await expect(
      producerListRepository.getProducers(query)
    ).rejects.toBeInstanceOf(InfraError)
    await expect(
      producerListRepository.countProducers(query)
    ).rejects.toBeInstanceOf(InfraError)
  })
})

describe('producerDetailsRepository', () => {
  it('returns the row or undefined', async () => {
    select.mockReturnValue(chainResolving([{ malId: 4 }]))
    expect(await producerDetailsRepository.getProducer(4)).toEqual({ malId: 4 })
    select.mockReturnValue(chainResolving([]))
    expect(await producerDetailsRepository.getProducer(4)).toBeUndefined()
  })

  it('returns titles and credit counts', async () => {
    select.mockReturnValue(
      chainResolving([{ title: 'Bones', type: 'Default' }])
    )
    expect(await producerDetailsRepository.getTitles(4)).toHaveLength(1)
    execute.mockResolvedValue({ rows: [{ role: 'studio', works: 3 }] })
    expect(await producerDetailsRepository.getCreditCounts(4)).toEqual([
      { role: 'studio', works: 3 },
    ])
  })

  it('wraps errors', async () => {
    select.mockImplementation(throwOnQuery)
    execute.mockRejectedValue(new Error('boom'))
    await expect(
      producerDetailsRepository.getProducer(1)
    ).rejects.toBeInstanceOf(InfraError)
    await expect(producerDetailsRepository.getTitles(1)).rejects.toBeInstanceOf(
      InfraError
    )
    await expect(
      producerDetailsRepository.getCreditCounts(1)
    ).rejects.toBeInstanceOf(InfraError)
  })
})
