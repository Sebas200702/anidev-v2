/**
 * Types for the search-history repository unit.
 *
 * @module domains/search/repositories/search-history/types
 */
import type { searchHistory } from '@db/schemas/search-history'

/** A persisted search-history row. */
export type SearchHistoryRow = typeof searchHistory.$inferSelect

/** Input for recording an executed search. */
export interface RecordSearchInput {
  userId: string
  /** Content type searched (`anime`, `music`, …). */
  scope: string
  query?: string | null
  filters?: unknown
}
