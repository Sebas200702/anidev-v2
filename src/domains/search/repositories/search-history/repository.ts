/**
 * Data access for per-user, cross-domain search history.
 *
 * @module domains/search/repositories/search-history/repository
 * @remarks
 * Owner-scoped by `userId` on every method. Growth is bounded by a per-user cap
 * pruned on record. Ordering uses `createdAt desc, id desc` for a deterministic
 * newest-first result.
 */
import { db } from '@db/client'
import { searchHistory } from '@db/schemas/search-history'
import { SEARCH_HISTORY_PER_USER_CAP } from '@search/constants'
import { dbError } from '@shared/errors/db-errors'
import { and, desc, eq, notInArray } from 'drizzle-orm'
import type { RecordSearchInput, SearchHistoryRow } from './types'

export const searchHistoryRepository = {
  /**
   * Inserts a search row and prunes the user's rows beyond the cap.
   *
   * @throws {InfraError} On database failure (`[RECORD_SEARCH_HISTORY]`)
   */
  async record({
    userId,
    scope,
    query,
    filters,
  }: RecordSearchInput): Promise<void> {
    try {
      await db.insert(searchHistory).values({
        userId,
        scope,
        query: query ?? null,
        filters: filters ?? null,
      })

      const keptIds = db
        .select({ id: searchHistory.id })
        .from(searchHistory)
        .where(eq(searchHistory.userId, userId))
        .orderBy(desc(searchHistory.createdAt), desc(searchHistory.id))
        .limit(SEARCH_HISTORY_PER_USER_CAP)

      await db
        .delete(searchHistory)
        .where(
          and(
            eq(searchHistory.userId, userId),
            notInArray(searchHistory.id, keptIds)
          )
        )
    } catch (error) {
      throw dbError('[RECORD_SEARCH_HISTORY]', { userId }, error)
    }
  },

  /**
   * Lists a user's recent searches, newest first, bounded by `limit`.
   *
   * @throws {InfraError} On database failure (`[LIST_SEARCH_HISTORY]`)
   */
  async listByUser(userId: string, limit: number): Promise<SearchHistoryRow[]> {
    try {
      return await db
        .select()
        .from(searchHistory)
        .where(eq(searchHistory.userId, userId))
        .orderBy(desc(searchHistory.createdAt), desc(searchHistory.id))
        .limit(limit)
    } catch (error) {
      throw dbError('[LIST_SEARCH_HISTORY]', { userId }, error)
    }
  },

  /**
   * Deletes all of a user's search history.
   *
   * @returns Number of rows removed
   * @throws {InfraError} On database failure (`[CLEAR_SEARCH_HISTORY]`)
   */
  async clearByUser(userId: string): Promise<number> {
    try {
      const deleted = await db
        .delete(searchHistory)
        .where(eq(searchHistory.userId, userId))
        .returning({ id: searchHistory.id })
      return deleted.length
    } catch (error) {
      throw dbError('[CLEAR_SEARCH_HISTORY]', { userId }, error)
    }
  },
}
