/**
 * @module @domains/media/cache
 * @remarks Barrel exports for optimized media image cache helpers keyed by semantic paths
 * or direct source URLs.
 * @see {@link ./media-cache} for serialization and cache key construction
 * @example
 * ```typescript
 * import { mediaCache } from '@domains/media/cache'
 * ```
 */

export { type CachedOptimizedMedia, serializeImage, deserializeImage } from './media-cache-serialization'
export { buildKey, buildRawKey, buildRawMetaKey } from './media-cache-keys'
export { type RawMeta } from './media-cache-store'
export { mediaCache, imageCache } from './media-cache'
