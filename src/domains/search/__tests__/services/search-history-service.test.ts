/**
 * Unit tests for the search-history service best-effort record contract.
 *
 * @module domains/search/__tests__/services/search-history-service
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

const record = vi.fn()
const listByUser = vi.fn()
const clearByUser = vi.fn()

vi.mock('@search/repositories/search-history', () => ({
  searchHistoryRepository: { record, listByUser, clearByUser },
}))
vi.mock('@utils/logger-util', () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
}))

const { searchHistoryService } = await import('@search/services/search-history')

describe('searchHistoryService.record (best-effort)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('does not throw when the repository fails', async () => {
    record.mockRejectedValueOnce(new Error('db down'))
    await expect(
      searchHistoryService.record({ userId: 'u1', scope: 'anime', query: 'x' })
    ).resolves.toBeUndefined()
  })

  it('records via the repository on the happy path', async () => {
    record.mockResolvedValueOnce(undefined)
    await searchHistoryService.record({
      userId: 'u1',
      scope: 'anime',
      query: 'naruto',
    })
    expect(record).toHaveBeenCalledWith({
      userId: 'u1',
      scope: 'anime',
      query: 'naruto',
    })
  })

  it('propagates list/clear results from the repository', async () => {
    listByUser.mockResolvedValueOnce([{ id: 1 }])
    clearByUser.mockResolvedValueOnce(3)
    expect(await searchHistoryService.list('u1', 20)).toEqual([{ id: 1 }])
    expect(await searchHistoryService.clear('u1')).toBe(3)
  })
})
