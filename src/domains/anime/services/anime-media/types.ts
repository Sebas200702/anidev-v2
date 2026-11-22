/**
 * Type definitions for the anime-media service.
 *
 * @module domains/anime/services/anime-media/types
 */
import type { AnimeMediaItem } from '@anime/types'

/**
 * Filter and page coordinates for {@link animeMediaService.getMediaPage}.
 */
export interface AnimeMediaPageInput {
  /** Parent anime MAL ID */
  malId: number
  /** Optional lowercased `mediaType` filter (e.g. `banner`) */
  type?: string
  /** 1-based page number */
  page: number
  /** Items per page */
  limit: number
}

/** One page of media plus the total matching the filter. */
export interface AnimeMediaPage {
  list: AnimeMediaItem[]
  total: number
}
