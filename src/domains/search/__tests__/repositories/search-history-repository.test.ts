/**
 * Unit tests for {@link searchHistoryRepository}.
 *
 * @module domains/search/__tests__/repositories/search-history-repository
 * @remarks
 * The Drizzle client is mocked with a chainable stub. Covers the record (insert + prune), list, and
 * clear (returning count) methods plus each `dbError` catch branch. Follows the repo TDD/unit-test
 * layout.
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

const { select, insert, del, execute, transaction } = vi.hoisted(() => {
  const select = vi.fn()
  const insert = vi.fn()
  const del = vi.fn()
  const execute = vi.fn()
  const tx = { select, insert, delete: del, execute }
  const transaction = vi.fn(async (cb: (tx: unknown) => Promise<unknown>) =>
    cb(tx)
  )
  return { select, insert, del, execute, transaction }
})
vi.mock('@db/client', () => ({
  db: { select, insert, delete: del, transaction },
}))

const { searchHistoryRepository } = await import(
  '@search/repositories/search-history'
)

beforeEach(() => {
  vi.clearAllMocks()
  select.mockReturnValue(chainResolving([]))
  insert.mockReturnValue(chainResolving(undefined))
  del.mockReturnValue(chainResolving(undefined))
})

describe('searchHistoryRepository.record', () => {
  it('inserts a row and prunes beyond the per-user cap', async () => {
    await searchHistoryRepository.record({
      userId: 'u1',
      scope: 'anime',
      query: 'naruto',
      filters: { genre: 'Action' },
    } as never)

    expect(insert).toHaveBeenCalled()
    expect(del).toHaveBeenCalled()
  })

  it('handles null query and filters', async () => {
    await searchHistoryRepository.record({
      userId: 'u1',
      scope: 'anime',
    } as never)
    expect(insert).toHaveBeenCalled()
  })

  it('takes the per-user advisory lock inside the transaction', async () => {
    await searchHistoryRepository.record({
      userId: 'u1',
      scope: 'anime',
    } as never)

    expect(transaction).toHaveBeenCalled()
    expect(execute).toHaveBeenCalled()
    expect(insert).toHaveBeenCalled()
    expect(del).toHaveBeenCalled()
  })

  it('wraps errors', async () => {
    transaction.mockImplementation(throwOnQuery)
    await expect(
      searchHistoryRepository.record({ userId: 'u1', scope: 'anime' } as never)
    ).rejects.toBeInstanceOf(InfraError)
  })
})

describe('searchHistoryRepository.listByUser', () => {
  it('returns rows for the user', async () => {
    select.mockReturnValue(chainResolving([{ id: 1 }]))
    expect(await searchHistoryRepository.listByUser('u1', 10)).toEqual([
      { id: 1 },
    ])
  })

  it('wraps errors', async () => {
    select.mockImplementation(throwOnQuery)
    await expect(
      searchHistoryRepository.listByUser('u1', 10)
    ).rejects.toBeInstanceOf(InfraError)
  })
})

describe('searchHistoryRepository.clearByUser', () => {
  it('returns the number of deleted rows', async () => {
    del.mockReturnValue(chainResolving([{ id: 1 }, { id: 2 }]))
    expect(await searchHistoryRepository.clearByUser('u1')).toBe(2)
  })

  it('wraps errors', async () => {
    del.mockImplementation(throwOnQuery)
    await expect(
      searchHistoryRepository.clearByUser('u1')
    ).rejects.toBeInstanceOf(InfraError)
  })
})
