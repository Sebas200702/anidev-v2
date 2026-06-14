/**
 * @module @domains/media/types
 * @remarks Barrel exports for shared media domain types covering semantic paths, assets,
 * request shapes, and service configuration.
 * @see {@link @domains/media/types/media-types} for all type definitions
 * @example
 * ```typescript
 * import type { SemanticMediaPath, MediaAsset, OptimizedMedia } from '@domains/media/types'
 * ```
 */

export { MediaEntity, MediaType, MediaSize } from './media-enums'
export type { OptimizedMedia, SemanticMediaPath, MediaAsset } from './media-asset-types'
export type { MediaRequest, MediaRequestQuery, MediaRequestParams } from './media-request-types'
export type { MediaServiceConfig, MediaCacheKeyOptions } from './media-config-types'
