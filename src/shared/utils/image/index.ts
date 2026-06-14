/**
 * Image optimization, URL normalization, semantic path parsing, and media asset resolution.
 *
 * @module shared/utils/image
 * @remarks
 * Used by the media proxy route: {@link parseMediaPath} → {@link resolveMediaAssets} →
 * {@link optimizeImageBuffer} with {@link normalizeImageUrl} for upstream URLs.
 *
 * @see {@link parseMediaPath}
 * @see {@link optimizeImageBuffer}
 * @see {@link normalizeImageUrl}
 */

export { normalizeImageUrl } from './normalize-image-url-util'
export { normalizeMediaId, normalizeAssetSize, resolveMediaAssets } from './normalize-media-util'
export {
  type ImageFormat,
  type ImageSource,
  type OptimizeOptions,
  ImageTooLargeError,
  normalizeOptimizeOptions,
} from './optimize-util'
export {
  RAW_ENTITIES,
  isSupportedMediaType,
  isSupportedEntity,
  isSupportedMediaSize,
  isValidMediaType,
} from './media-path-guards'
export {
  type ParsedMediaSegments,
  parseTypeFirstPattern,
  parseSlugThenTypePattern,
  parseRawEntityPattern,
} from './media-segment-parsers'
export { parseMediaPath } from './parse-media-type-util'
