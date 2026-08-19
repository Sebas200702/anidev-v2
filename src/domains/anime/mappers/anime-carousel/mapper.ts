/**
 * Maps anime rows, media assets and taxonomy into carousel slides.
 *
 * @module domains/anime/mappers/anime-carousel/mapper
 */
import { CAROUSEL_SOURCE_PRIORITY } from '@anime/constants'
import type { CarouselItem } from '@anime/types'
import { detectMediaSource } from '@media/mappers/media-assets'
import { buildMediaUrl } from '@media/mappers/media-url'
import type { MediaAsset } from '@media/types'
import type { MapCarouselItemInput } from './types'

const MEDIA_SIZES = ['default', 'small', 'large'] as const

type MediaSize = (typeof MEDIA_SIZES)[number]

const resolveSize = (size: string | null): MediaSize =>
  MEDIA_SIZES.find((candidate) => candidate === size) ?? 'default'

/**
 * Picks the best asset of a type, preferring richer upstream sources.
 *
 * @param assets - Every asset attached to the anime
 * @param mediaType - Asset category (`banner`, `clearlogo`)
 * @returns The preferred asset, or `undefined` when the type is absent
 *
 * @see {@link CAROUSEL_SOURCE_PRIORITY}
 */
export const pickBestAsset = (
  assets: MediaAsset[],
  mediaType: string
): MediaAsset | undefined => {
  const matches = assets.filter((asset) => asset.mediaType === mediaType)
  if (matches.length === 0) return undefined

  for (const source of CAROUSEL_SOURCE_PRIORITY) {
    const found = matches.find(
      (asset) => detectMediaSource(asset.src) === source
    )
    if (found) return found
  }

  return matches[0]
}

const buildAssetUrl = (
  malId: number,
  type: string,
  asset: MediaAsset | undefined
): string =>
  asset
    ? buildMediaUrl({
        entity: 'anime',
        entity_id: malId,
        type,
        size: resolveSize(asset.size),
        index: 1,
        source: detectMediaSource(asset.src),
      })
    : ''

/**
 * Builds one carousel slide.
 *
 * @param input - Anime row plus its media assets and genres
 * @returns A {@link CarouselItem} with proxied media URLs
 *
 * @remarks
 * Missing artwork yields an empty string rather than a broken URL, and null
 * numerics fall back to `0` so the slide always validates.
 *
 * @example
 * ```typescript
 * const slide = mapCarouselItem({ anime, media, genres })
 * ```
 */
export const mapCarouselItem = ({
  anime,
  media,
  genres,
}: MapCarouselItemInput): CarouselItem => ({
  malId: anime.malId,
  title: anime.title,
  clearLogo: buildAssetUrl(
    anime.malId,
    'clearlogo',
    pickBestAsset(media, 'clearlogo')
  ),
  bannerImage: buildAssetUrl(
    anime.malId,
    'banner',
    pickBestAsset(media, 'banner')
  ),
  description: anime.synopsis ?? '',
  genres: genres.map((genre) => ({
    malId: genre.malId,
    name: genre.name,
    url: `/discover?genre=${encodeURIComponent(genre.name)}`,
  })),
  score: anime.score ?? 0,
  year: anime.year ?? 0,
  season: anime.season ?? 'Unknown',
})
