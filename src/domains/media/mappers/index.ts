/**
 * @module @domains/media/mappers
 * @remarks Barrel exports for media mappers covering semantic URL construction and asset
 * filtering/selection for the optimization pipeline.
 * @see {@link ./media-url-mapper} for building on-site media routes
 * @see {@link ./media-assets-mapper} for size/source filtering and index selection
 * @example
 * ```typescript
 * import { buildMediaUrl, mapFilteredMediaAssets } from '@domains/media/mappers'
 * ```
 */
export * from './media-assets-mapper'
export * from './media-url-mapper'
