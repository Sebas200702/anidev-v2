import {
  normalizeAssetSize,
  normalizeMediaId,
} from '@/core/utils/image/normalize-media'
import type { OptimizeOptions } from '@/core/utils/image/optimize'
import type { MediaAsset, MediaSize } from '@/domains/media/types/media'

type MediaSource = NonNullable<OptimizeOptions['source']>

const detectMediaSource = (src: string): MediaSource => {
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
