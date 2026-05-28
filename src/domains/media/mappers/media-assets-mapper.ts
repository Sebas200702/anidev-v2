/**
 * @module @domains/media/mappers/media-assets-mapper
 * @remarks Maps and filters resolved media assets for delivery. Supports size normalization,
 * optional upstream source filtering by hostname, and 1-based asset index selection.
 */
import {
  normalizeAssetSize,
  normalizeMediaId,
} from '@utils/image/normalize-media-util'
import type { OptimizeOptions } from '@utils/image/optimize-util'
import type { MediaAsset, MediaSize } from '@domains/media/types/media-types'

type MediaSource = NonNullable<OptimizeOptions['source']>

/**
 * Infers the upstream source host for a media asset URL.
 *
 * @param src - Absolute media URL
 * @returns Detected media source identifier, or `custom` when unknown or invalid
 * @throws Does not throw; returns `custom` on URL parse failures
 * @see {@link mapFilteredMediaAssets} for source-based filtering
 * @example
 * ```typescript
 * detectMediaSource('https://cdn.myanimelist.net/images/anime/1.jpg')
 * // "myanimelist"
 * ```
 */
export const detectMediaSource = (src: string): MediaSource => {
  try {
    const host = new URL(src).hostname.toLowerCase()

    if (host.includes('myanimelist')) {
      return 'myanimelist'
    }

    if (host.includes('anilist')) {
      return 'anilist'
    }

    if (host.includes('kitsu')) {
      return 'kitsu'
    }

    if (host.includes('thetvdb')) {
      return 'thetvdb'
    }

    if (host.includes('tmdb') || host.includes('themoviedb')) {
      return 'tmdb'
    }

    if (host.includes('youtube')) {
      return 'youtube'
    }
  } catch {
    return 'custom'
  }

  return 'custom'
}

type MapAssetsInput = {
  assets: MediaAsset[]
  mediaSize: MediaSize
  source?: OptimizeOptions['source']
}

/**
 * Filters assets by size and optional upstream source.
 *
 * @remarks First normalizes asset `size` values via {@link normalizeAssetSize}, then optionally
 * filters by detected hostname when `source` is provided.
 * @param input - Candidate assets and filter criteria
 * @returns Assets matching the requested size and source
 * @throws Does not throw
 * @see {@link mediaService.resolveMedia} for pipeline usage
 * @see {@link mapIndexedMediaAsset} for selecting a single asset from the filtered list
 * @example
 * ```typescript
 * const filtered = mapFilteredMediaAssets({
 *   assets,
 *   mediaSize: MediaSize.LARGE,
 *   source: 'myanimelist',
 * })
 * ```
 */
export const mapFilteredMediaAssets = ({
  assets,
  mediaSize,
  source,
}: MapAssetsInput): MediaAsset[] => {
  const sizeFilteredAssets = assets.filter(
    (asset) => normalizeAssetSize(asset.size) === mediaSize
  )

  if (!source) {
    return sizeFilteredAssets
  }

  return sizeFilteredAssets.filter(
    (asset) => detectMediaSource(asset.src) === source
  )
}

/**
 * Selects a single asset from a list using a 1-based media index.
 *
 * @remarks Uses {@link normalizeMediaId} to clamp out-of-range indices. Returns `undefined`
 * when the asset list is empty or no asset matches the normalized index.
 * @param assets - Filtered candidate assets
 * @param mediaId - Optional 1-based asset index from {@link SemanticMediaPath.mediaId}
 * @returns Selected {@link MediaAsset} or `undefined` when none match
 * @throws Does not throw
 * @see {@link mediaService.resolveMedia} for placeholder fallback when undefined
 * @example
 * ```typescript
 * const asset = mapIndexedMediaAsset(filteredAssets, parsedPath.mediaId)
 * if (!asset) {
 *   // mediaService falls back to defaultPlaceholderUrl
 * }
 * ```
 */
export const mapIndexedMediaAsset = (
  assets: MediaAsset[],
  mediaId: number | undefined
): MediaAsset | undefined => {
  if (assets.length === 0) {
    return undefined
  }

  const mediaIndex = normalizeMediaId(mediaId, assets.length)
  return assets[mediaIndex - 1]
}
