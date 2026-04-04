import { withCache } from '@/core/cache'
import { ErrorCodes } from '@/core/errors/error-codes'
import { InfraError } from '@/core/errors/errors'
import { normalizeImageUrl } from '@/core/utils/image/normalize-image-url'
import { resolveMediaAssets } from '@/core/utils/image/normalize-media'
import {
  normalizeOptimizeOptions,
  type OptimizeOptions,
} from '@/core/utils/image/optimize'
import { mediaServiceConfig } from '@/domains/media/config'
import { parseMediaPath } from '@/core/utils/image/parse-media-type'
import { mediaCache } from '@/domains/media/cache/media'
import {
  mapFilteredMediaAssets,
  mapIndexedMediaAsset,
} from '@/domains/media/mappers/media-assets'

import { optimizeMediaImageBuffer } from '@/domains/media/services/image-optimizer'
import { fetchMediaAsset } from '@/domains/media/services/media-fetch'
import type {
  MediaAsset,
  OptimizedMedia,
  SemanticMediaPath,
} from '@/domains/media/types/media'

export const mediaService = {
  parsePath: parseMediaPath,
  async resolveMedia(
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
  },
  async getEntityMedia(
    params: SemanticMediaPath,
    source?: OptimizeOptions['source']
  ): Promise<MediaAsset> {
    return this.resolveMedia(params, source)
  },
  async optimizeMedia(
    params: SemanticMediaPath | null,
    options: OptimizeOptions = {}
  ): Promise<OptimizedMedia> {
    if (!params) {
      throw new InfraError(
        ErrorCodes.INVALID_IMAGE_PATH,
        'Invalid media path',
        { params }
      )
    }

    const normalizedOptions = normalizeOptimizeOptions(options)
    const resolvedParams = params

    return withCache({
      key: mediaCache.key(resolvedParams, normalizedOptions),
      getCache: () => mediaCache.get(resolvedParams, normalizedOptions),
      setCache: (_, value) =>
        mediaCache.set(resolvedParams, normalizedOptions, value),
      compute: async () => {
        const media = await this.resolveMedia(
          resolvedParams,
          normalizedOptions.source
        )
        const buffer = await this.fetchImageBuffer(media.src)
        return optimizeMediaImageBuffer(buffer, normalizedOptions)
      },
    })
  },
  async optimizeEntityMedia(
    params: SemanticMediaPath | null,
    options: OptimizeOptions = {}
  ): Promise<OptimizedMedia> {
    return this.optimizeMedia(params, options)
  },
  async optimizeAndCacheImage(
    imageUrl: string,
    options: OptimizeOptions = {}
  ): Promise<OptimizedMedia> {
    return this.optimizeMediaByUrl(imageUrl, options)
  },
  async optimizeMediaByUrl(
    imageUrl: string,
    options: OptimizeOptions = {}
  ): Promise<OptimizedMedia> {
    const normalizedImageUrl = normalizeImageUrl(imageUrl)
    const normalizedOptions = normalizeOptimizeOptions(options)

    return withCache({
      key: mediaCache.keyFromUrl(normalizedImageUrl, normalizedOptions),
      getCache: () =>
        mediaCache.getFromUrl(normalizedImageUrl, normalizedOptions),
      setCache: (_, value) =>
        mediaCache.setFromUrl(normalizedImageUrl, normalizedOptions, value),
      compute: async () => {
        const buffer = await this.fetchImageBuffer(normalizedImageUrl)
        return optimizeMediaImageBuffer(buffer, normalizedOptions)
      },
    })
  },
  async fetchImageBuffer(imageUrl: string): Promise<Buffer> {
    const normalizedImageUrl = normalizeImageUrl(imageUrl)
    const media = await fetchMediaAsset(normalizedImageUrl, {
      accept: 'image/webp,image/avif,image/apng,image/*,*/*;q=0.8',
    })

    if (!media.mimeType.startsWith('image/')) {
      throw new InfraError(
        ErrorCodes.EXTERNAL_API_ERROR,
        'Fetched resource is not an image',
        { url: normalizedImageUrl, mimeType: media.mimeType }
      )
    }

    return media.buffer
  },
}
