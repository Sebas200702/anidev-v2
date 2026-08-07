/**
 * Type definitions for anime list filter builders.
 *
 * @module domains/anime/repositories/anime-list-filters-types
 */
import type { AnimeFilters } from '@anime/types'

/**
 * Filter fields used to build SQL `WHERE` clauses (excludes pagination).
 */
export type AnimeListFilterParams = Omit<AnimeFilters, 'page' | 'limit'>
