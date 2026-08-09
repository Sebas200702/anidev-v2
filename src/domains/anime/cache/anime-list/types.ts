/**
 * Type definitions for the anime list cache.
 *
 * @module domains/anime/cache/anime-list/types
 */
import type { AnimeCard } from '@anime/types'

/**
 * Cached payload for a filtered anime list query.
 *
 * @remarks
 * Mirrors the return shape of {@link animeListService.getAnimeList}.
 */
export interface AnimeListCacheValue {
  /** Mapped card rows for the current page */
  list: AnimeCard[]
  /** Total distinct anime rows matching filters (all pages) */
  total: number
}
