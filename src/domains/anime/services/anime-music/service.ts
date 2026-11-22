/**
 * Application service for the openings and endings of an anime.
 *
 * @module domains/anime/services/anime-music/service
 */
import { animeMusicNotFound } from '@anime/errors'
import { mapAnimeMusicItems } from '@anime/mappers/anime-music-item'
import type { AnimeMusicItem } from '@anime/types'
import type { StaleResult } from '@lib/cache/cache-store-types'
import { getMusicByAnimeId } from '@music/services/anime-music'
import { assertAnimeExists } from '../anime-episodes/helpers'
import type { AnimeMusicPage, AnimeMusicPageInput } from './types'

/**
 * Loads the full mapped theme list of an anime.
 *
 * @remarks
 * Rows come cached (with stale fallback) from {@link getMusicByAnimeId}. The
 * existence check runs only on an empty list, so normal reads pay no extra
 * query.
 *
 * @throws {AnimeNotFoundError} When the list is empty and the anime is missing
 * @throws {InfraError} On database/cache failure with no stale copy
 */
const getAllMusic = async (
  malId: number
): Promise<StaleResult<AnimeMusicItem[]>> => {
  const { value: rows, isStale } = await getMusicByAnimeId(malId)
  if (rows.length === 0) await assertAnimeExists(malId)
  return { value: mapAnimeMusicItems(rows), isStale }
}

/**
 * Coordinates the music read, mapping and filtering for anime music reads.
 *
 * @remarks
 * **Pipeline:** music service (cached) → mapper, then filter and slice in
 * memory. Items keep the `order`/`url` `/full` exposes for the same theme.
 *
 * @see {@link getMusicByAnimeId}
 */
export const animeMusicService = {
  /**
   * Loads one page of an anime's themes, optionally filtered by type.
   *
   * @param input - `{ malId, type?, page, limit }`
   * @returns `{ value: { list, total }, isStale }` — `total` counts the filter
   *
   * @throws {AnimeNotFoundError} When the anime is missing
   * @throws {InfraError} On database/cache failure with no stale copy
   *
   * @example
   * ```typescript
   * const { value } = await animeMusicService.getMusicPage({ malId: 1, type: 'opening', page: 1, limit: 24 })
   * // value.list[0] → { id: 10, order: 1, type: 'opening', … }
   * ```
   */
  async getMusicPage({
    malId,
    type,
    page,
    limit,
  }: AnimeMusicPageInput): Promise<StaleResult<AnimeMusicPage>> {
    const { value: music, isStale } = await getAllMusic(malId)
    const filtered = type ? music.filter((theme) => theme.type === type) : music
    const start = (page - 1) * limit

    return {
      value: {
        list: filtered.slice(start, start + limit),
        total: filtered.length,
      },
      isStale,
    }
  },

  /**
   * Loads one opening or ending of an anime by its `music.id`.
   *
   * @param malId - Parent anime MAL ID
   * @param musicId - Music id; an id not linked to this anime counts as missing
   * @returns `{ value: AnimeMusicItem, isStale }`
   *
   * @throws {AnimeNotFoundError} When the anime is missing
   * @throws {AnimeMusicNotFoundError} When the anime has no theme with that id
   * @throws {InfraError} On database/cache failure with no stale copy
   */
  async getMusicItem(
    malId: number,
    musicId: number
  ): Promise<StaleResult<AnimeMusicItem>> {
    const { value: music, isStale } = await getAllMusic(malId)
    const item = music.find(({ id }) => id === musicId)
    if (!item) throw animeMusicNotFound(malId, musicId)
    return { value: item, isStale }
  },
}
