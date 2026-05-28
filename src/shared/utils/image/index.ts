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

export * from './normalize-image-url-util'
export * from './normalize-media-util'
export * from './optimize-util'
export * from './parse-media-type-util'
