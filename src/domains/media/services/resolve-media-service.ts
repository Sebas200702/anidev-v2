/**
 * @module @domains/media/services/resolve-media-service
 * @remarks Resolves the best matching {@link MediaAsset} for a parsed semantic media path.
 * Loads candidate assets from entity repositories, filters by size and optional source host,
 * then selects a single asset by 1-based index. Falls back to a placeholder when none match.
 */
import { resolveMediaAssets } from '@utils/image/normalize-media-util'
import type { OptimizeOptions } from '@utils/image/optimize-util'
import { mediaServiceConfig } from '@domains/media/config'
import {
  mapFilteredMediaAssets,
  mapIndexedMediaAsset,
} from '@domains/media/mappers/media-assets-mapper'
import type {
  MediaAsset,
  SemanticMediaPath,
} from '@domains/media/types/media-types'

/**
 * Resolves the best matching media asset for a semantic path.
 *
 * @remarks Loads assets via {@link resolveMediaAssets}, filters by size and optional source,
 * then selects by index. Returns a placeholder asset when no match is found.
 * @param params - Parsed media path segments
 * @param source - Optional upstream source filter applied before index selection
 * @returns Selected {@link MediaAsset} or a placeholder when none match
 * @throws May propagate repository or asset resolution failures
 * @see {@link mediaServiceConfig.defaultPlaceholderUrl} for fallback `src`
 * @example
 * ```typescript
 * const asset = await resolveMedia(parsedPath, 'myanimelist')
 * console.log(asset.src)
 * ```
 */
export async function resolveMedia(
  params: SemanticMediaPath,
  source?: OptimizeOptions['source']
): Promise<MediaAsset> {
  const assets = await resolveMediaAssets(params)
  const sourceFilteredAssets = mapFilteredMediaAssets({
    assets,
    mediaSize: params.mediaSize,
    source,
  })
  const asset = mapIndexedMediaAsset(sourceFilteredAssets, params.mediaId)

  if (!asset) {
    return {
      id: 0,
      mediaType: params.mediaType,
      src: mediaServiceConfig.defaultPlaceholderUrl,
      size: params.mediaSize,
    }
  }

  return asset
}
