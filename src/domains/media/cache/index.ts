/**
 * @module @media/cache
 * @remarks Barrel exports for optimized media image cache helpers keyed by semantic paths
 * or direct source URLs.
 * @see {@link ./media-cache} for disk caching and cache key construction
 * @example
 * ```typescript
 * import { mediaCache } from '@media/cache'
 * ```
 */

export {
  type RawMeta,
  buildKey,
  buildRawKey,
  buildRawMetaKey,
  mediaCache,
  imageCache,
} from './media-cache'
