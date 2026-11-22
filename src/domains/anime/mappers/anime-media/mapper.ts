/**
 * Maps `anime_media` rows into anime media API payloads.
 *
 * @module domains/anime/mappers/anime-media/mapper
 */
import type { AnimeMediaItem } from '@anime/types'
import { detectMediaSource } from '@media/mappers/media-assets'
import { buildMediaUrl } from '@media/mappers/media-url'
import type { MediaAsset } from '@media/types/media-types'
import { normalizeAssetSize } from '@media/utils/image/normalize-media-util'

/**
 * Maps every asset of one anime to an {@link AnimeMediaItem}, preserving order.
 *
 * @remarks
 * The `/media` resolver selects an asset by a 1-based index inside its
 * (type, size, source) group, in repository order (`priority`, `id`). The
 * index is therefore computed over the **whole** anime list here — filtering
 * or paginating afterwards keeps every URL pointing at the same asset.
 *
 * @param malId - Parent anime MAL ID
 * @param assets - All of the anime's rows, ordered by priority then id
 * @returns Items with origin-relative proxy URLs
 *
 * @see {@link mapFilteredMediaAssets} — the resolver-side grouping
 * @example
 * ```typescript
 * mapAnimeMediaItems(1, rows)[0]
 * // { id: 7, mediaType: 'banner', size: 'default', source: 'anilist',
 * //   url: '/media/anime/1/banner/default/1?source=anilist' }
 * ```
 */
export const mapAnimeMediaItems = (
  malId: number,
  assets: MediaAsset[]
): AnimeMediaItem[] => {
  const groupCounts = new Map<string, number>()

  return assets.map(({ id, mediaType, src, size: rawSize }) => {
    const size = normalizeAssetSize(rawSize)
    const source = detectMediaSource(src)
    const groupKey = `${mediaType}:${size}:${source}`
    const index = (groupCounts.get(groupKey) ?? 0) + 1
    groupCounts.set(groupKey, index)

    return {
      id,
      mediaType,
      size,
      source,
      url: buildMediaUrl({
        entity: 'anime',
        entity_id: malId,
        type: mediaType,
        size,
        index,
        source,
      }),
    }
  })
}
