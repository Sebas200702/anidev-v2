/**
 * Types for the read-through cache orchestration wrapper.
 *
 * @module lib/cache/cache-store-types
 * @remarks
 * Consumed by {@link module:lib/cache/cache-store} to shape the key, accessors,
 * compute delegate, and optional caching predicate used by {@link withCache} and
 * {@link withStaleCache}.
 *
 * @see {@link withCache} for the read-through wrapper
 * @see {@link withStaleCache} for the stale-serve wrapper
 */

/**
 * Result envelope produced by stale-serve orchestration.
 *
 * @typeParam T - Cached value type
 * @property value - Computed, cached, or stale-served payload
 * @property isStale - `true` when served from the `:stale` snapshot after a failed compute
 */
export interface StaleResult<T> {
  value: T
  isStale: boolean
}

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

/**
 * Options for {@link withStaleCache} stale-serve orchestration.
 *
 * @typeParam T - Cached value type
 * @property key - Redis key for the fresh value
 * @property staleKey - Companion Redis key holding the last-known-good snapshot
 * @property getCache - Async reader for the fresh value; `null` on miss
 * @property getStaleCache - Async reader for the `:stale` snapshot; `null` on miss
 * @property setCache - Async writer for the fresh value after successful compute
 * @property setStaleCache - Async writer for the `:stale` snapshot after successful compute
 * @property compute - Source-of-truth fetch when the fresh cache misses
 * @property shouldCache - Optional predicate; when returns `false`, result is
 * returned but not stored (default: always cache)
 */
export interface WithStaleCacheOptions<T> {
  key: string
  staleKey: string
  getCache: (key: string) => Promise<T | null>
  getStaleCache: (key: string) => Promise<T | null>
  setCache: (key: string, value: T) => Promise<void>
  setStaleCache: (key: string, value: T) => Promise<void>
  compute: () => Promise<T>
  shouldCache?: (result: T) => boolean
}
