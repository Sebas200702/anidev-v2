/**
 * Type definitions for the anime-episodes repository.
 *
 * @module domains/anime/repositories/anime-episodes/types
 */

/**
 * Page coordinates for {@link animeEpisodesRepository.getEpisodesPage}.
 */
export interface EpisodesPageInput {
  /** Parent anime MAL ID (`episode.anime_id`) */
  malId: number
  /** 1-based page number */
  page: number
  /** Rows per page */
  limit: number
}
