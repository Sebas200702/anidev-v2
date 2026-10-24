/**
 * Type definitions for the anime-episodes cache.
 *
 * @module domains/anime/cache/anime-episodes/types
 */
import type { AnimeEpisodeItem } from '@anime/types'

/**
 * Cached list page: the items plus the anime's total episode count.
 */
export interface AnimeEpisodesPage {
  list: AnimeEpisodeItem[]
  total: number
}
