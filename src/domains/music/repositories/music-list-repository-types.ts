/**
 * @module @music/repositories/music-list-repository-types
 * @remarks Derived filter type for building SQL `WHERE` clauses in music list
 * queries.
 */
import type { MusicListFilters } from '@music/types'

/**
 * Filter fields used to build SQL `WHERE` clauses (excludes pagination).
 */
export type MusicListFilterParams = Omit<MusicListFilters, 'page' | 'limit'>
