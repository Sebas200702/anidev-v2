/**
 * @module @domains/music/cache
 * @remarks Barrel exports for music cache helpers. Currently exposes read-through cache
 * accessors keyed by internal music ID for {@link MusicDetails} payloads.
 * @see {@link ./music-cache} for cache key construction and TTL configuration
 * @example
 * ```typescript
 * import { musicCache } from '@domains/music/cache'
 *
 * const cached = await musicCache.get(42)
 * if (!cached) {
 *   await musicCache.set(42, details)
 * }
 * ```
 */

export { musicCache } from './music-cache'
export { musicListCache } from './music-list-cache'
