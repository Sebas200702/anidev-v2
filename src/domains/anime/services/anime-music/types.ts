/**
 * Type definitions for the anime-music service.
 *
 * @module domains/anime/services/anime-music/types
 */
import type { AnimeMusicItem } from '@anime/types'

/**
 * Filter and page coordinates for {@link animeMusicService.getMusicPage}.
 */
export interface AnimeMusicPageInput {
  /** Parent anime MAL ID */
  malId: number
  /** Optional theme kind filter */
  type?: AnimeMusicItem['type']
  /** 1-based page number */
  page: number
  /** Items per page */
  limit: number
}

/** One page of music plus the total matching the filter. */
export interface AnimeMusicPage {
  list: AnimeMusicItem[]
  total: number
}
