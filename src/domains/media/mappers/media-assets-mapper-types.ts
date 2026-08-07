/**
 * @module @media/mappers/media-assets-mapper-types
 * @remarks Source-identifier and input types for mapping and filtering resolved media assets.
 */
import type { OptimizeOptions } from '@utils/image/optimize-util'
import type { MediaAsset, MediaSize } from '@media/types/media-types'

export type MediaSource = NonNullable<OptimizeOptions['source']>

export interface MapAssetsInput {
  assets: MediaAsset[]
  mediaSize: MediaSize
  source?: OptimizeOptions['source']
}
