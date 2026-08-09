/**
 * @module domains/music/cache/music-list/types
 * @remarks Cached payload shape for paginated music list queries served by
 * {@link musicListCache}.
 */
import type { MusicCard } from '@music/types'

/**
 * Cached payload for a filtered music list query.
 *
 * @remarks
 * Mirrors the return shape of {@link musicListService.getMusicList}.
 */
export interface MusicListCacheValue {
  /** Mapped card rows for the current page */
  list: MusicCard[]
  /** Total rows matching filters (all pages) */
  total: number
}
