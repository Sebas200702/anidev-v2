/**
 * Application service for the media assets of an anime.
 *
 * @module domains/anime/services/anime-media/service
 */
import { animeMediaCache } from '@anime/cache/anime-media'
import { animeMediaNotFound } from '@anime/errors'
import { mapAnimeMediaItems } from '@anime/mappers/anime-media'
import type { AnimeMediaItem } from '@anime/types'
import { cacheGet, cacheSet, withStaleCache } from '@lib/cache'
import type { StaleResult } from '@lib/cache/cache-store-types'
import { CacheTtl } from '@lib/cache/config'
import { animeMediaRepository } from '@media/repositories/anime-media'
import { assertAnimeExists } from '../anime-episodes/helpers'
import type { AnimeMediaPage, AnimeMediaPageInput } from './types'

/**
 * Loads and caches the full mapped media list of an anime.
 *
 * @remarks
 * The existence check runs only on an empty list, so normal reads pay no extra
 * query. A missing anime throws inside `compute` and is never cached.
 *
 * @throws {AnimeNotFoundError} When the list is empty and the anime is missing
 * @throws {InfraError} On database/cache failure with no stale copy
 */
const getAllMedia = (malId: number): Promise<StaleResult<AnimeMediaItem[]>> => {
  const key = animeMediaCache.key(malId)
  return withStaleCache({
    key,
    staleKey: `${key}:stale`,
    getCache: () => animeMediaCache.get(malId),
    getStaleCache: (staleKey) => cacheGet<AnimeMediaItem[]>(staleKey),
    setCache: (_, value) => animeMediaCache.set(malId, value),
    setStaleCache: (staleKey, value) =>
      cacheSet(staleKey, value, { ttlSeconds: CacheTtl.Stale }),
    compute: async () => {
      const assets = await animeMediaRepository.getMediaByAnimeId(malId)
      if (assets.length === 0) await assertAnimeExists(malId)
      return mapAnimeMediaItems(malId, assets)
    },
  })
}

/**
 * Coordinates repository access, mapping and caching for anime media reads.
 *
 * @remarks
 * **Pipeline:** cache → repository → mapper → cache, then filter and slice in
 * memory. Proxy URL indices are computed on the full list, so a filtered or
 * paginated item keeps the URL the detail endpoint returns.
 *
 * @see {@link animeMediaCache}
 */
export const animeMediaService = {
  /**
   * Loads one page of an anime's media, optionally filtered by type.
   *
   * @param input - `{ malId, type?, page, limit }`
   * @returns `{ value: { list, total }, isStale }` — `total` counts the filter
   *
   * @throws {AnimeNotFoundError} When the anime is missing
   * @throws {InfraError} On database/cache failure with no stale copy
   *
   * @example
   * ```typescript
   * const { value } = await animeMediaService.getMediaPage({ malId: 1, type: 'banner', page: 1, limit: 24 })
   * // value.list[0].url → '/media/anime/1/banner/default/1?source=anilist'
   * ```
   */
  async getMediaPage({
    malId,
    type,
    page,
    limit,
  }: AnimeMediaPageInput): Promise<StaleResult<AnimeMediaPage>> {
    const { value: media, isStale } = await getAllMedia(malId)
    const filtered = type
      ? media.filter(({ mediaType }) => mediaType === type)
      : media
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
   * Loads one media asset of an anime by its `anime_media.id`.
   *
   * @param malId - Parent anime MAL ID
   * @param mediaId - Media asset id; an id from another anime counts as missing
   * @returns `{ value: AnimeMediaItem, isStale }`
   *
   * @throws {AnimeNotFoundError} When the anime is missing
   * @throws {AnimeMediaNotFoundError} When the anime has no asset with that id
   * @throws {InfraError} On database/cache failure with no stale copy
   */
  async getMediaItem(
    malId: number,
    mediaId: number
  ): Promise<StaleResult<AnimeMediaItem>> {
    const { value: media, isStale } = await getAllMedia(malId)
    const item = media.find(({ id }) => id === mediaId)
    if (!item) throw animeMediaNotFound(malId, mediaId)
    return { value: item, isStale }
  },
}
