/**
 * Types for the read-through cache orchestration wrapper.
 *
 * @module lib/cache/cache-store-types
 * @remarks
 * Consumed by {@link module:lib/cache/cache-store} to shape the key, accessors,
 * compute delegate, and optional caching predicate used by {@link withCache}.
 *
 * @see {@link withCache} for the read-through wrapper
 */

/**
 * Options for {@link withCache} read-through orchestration.
 *
 * @typeParam T - Cached value type
 * @property key - Redis key passed to get/set delegates
 * @property getCache - Async reader; should return `null` on miss
 * @property setCache - Async writer invoked after successful compute
 * @property compute - Source-of-truth fetch when cache misses
 * @property shouldCache - Optional predicate; when returns `false`, result is
 * returned but not stored (default: always cache)
 */
export interface WithCacheOptions<T> {
  key: string
  getCache: (key: string) => Promise<T | null>
  setCache: (key: string, value: T) => Promise<void>
  compute: () => Promise<T>
  shouldCache?: (result: T) => boolean
}
