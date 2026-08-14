/**
 * Application service for per-user, cross-domain search history.
 *
 * @module domains/search/services/search-history/service
 * @remarks
 * All methods are owner-scoped (callers pass the authenticated user id).
 * {@link searchHistoryService.record} is best-effort — it never throws so a
 * history failure cannot break the search request.
 */
import { logger } from '@utils/logger-util'
import { searchHistoryRepository } from '@search/repositories/search-history'
import type {
  RecordSearchInput,
  SearchHistoryRow,
} from '@search/repositories/search-history/types'

export const searchHistoryService = {
  /**
   * Best-effort record of an executed search. Failures are logged, not thrown.
   */
  async record(input: RecordSearchInput): Promise<void> {
    try {
      await searchHistoryRepository.record(input)
    } catch (error) {
      logger.warn(
        { err: error, userId: input.userId, scope: input.scope },
        'search history record failed (best-effort)'
      )
    }
  },

  /** Lists the user's recent searches (newest first). */
  async list(userId: string, limit: number): Promise<SearchHistoryRow[]> {
    return searchHistoryRepository.listByUser(userId, limit)
  },

  /** Clears the user's search history; returns the number of rows removed. */
  async clear(userId: string): Promise<number> {
    return searchHistoryRepository.clearByUser(userId)
  },
}
