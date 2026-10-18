/**
 * @module domains/media/mappers/media-assets/mapper
 * @remarks Maps and filters resolved media assets for delivery. Supports size normalization,
 * optional upstream source filtering by hostname, 1-based asset index selection, and size-based
 * fallback.
 *
 * **Size fallback rules**
 *
 * 1. Prefer assets whose normalized size exactly matches the requested {@link MediaSize}.
 * 2. If a source filter is provided, narrow the exact-size candidates to that source.
 * 3. If no exact-size asset is available for the requested source, fall back to
 *    {@link MediaSize.DEFAULT} assets filtered by the same source.
 * 4. If the source still produces no match, return all {@link MediaSize.DEFAULT} assets,
 *    ignoring the source filter.
 *
 * This allows URLs such as `/media/anime/21/poster/large?source=myanimelist` to serve the real
 * image when the database only stores a generic/default-sized asset (e.g. from AniList), while
 * still honouring `priority` ordering performed by the repositories.
 */
import {
  normalizeAssetSize,
  normalizeMediaId,
} from '@media/utils/image/normalize-media-util'
import { MediaSize } from '@media/types/media-types'
import type { MediaAsset } from '@media/types/media-types'
import type { MapAssetsInput, MediaSource } from './types'

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

/**
 * Filters assets by size and optional upstream source, with size fallback.
 *
 * @remarks First normalizes asset `size` values via {@link normalizeAssetSize}, then optionally
 * filters by detected hostname when `source` is provided. If no asset matches the requested
 * size/source combination, falls back to {@link MediaSize.DEFAULT} assets as described in the
 * module JSDoc.
 * @param input - Candidate assets and filter criteria
 * @returns Assets matching the requested size and source, or the fallback default assets
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
  const bySize = (size: MediaSize) =>
    assets.filter((asset) => normalizeAssetSize(asset.size) === size)
  const bySource = (candidates: MediaAsset[]) =>
    source
      ? candidates.filter((asset) => detectMediaSource(asset.src) === source)
      : candidates

  const exactSizeAssets = bySize(mediaSize)
  const exactSizeBySource = bySource(exactSizeAssets)

  // Exact size + source wins when available.
  if (exactSizeBySource.length > 0) {
    return exactSizeBySource
  }

  // If no exact-size match is available, fall back to default-sized assets while still
  // preferring the requested source.
  const defaultAssets = bySize(MediaSize.DEFAULT)
  const defaultBySource = bySource(defaultAssets)

  if (defaultBySource.length > 0) {
    return defaultBySource
  }

  // Last resort: ignore the source filter and return all default assets so the caller can
  // still pick the highest-priority real image instead of a placeholder.
  return defaultAssets
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
