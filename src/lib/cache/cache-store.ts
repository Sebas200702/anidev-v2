/**
 * @module lib/cache/cache-store
 *
 * Read-through `withCache` wrapper built on the cache primitives. Re-exports
 * {@link cacheGet}, {@link cacheSet}, and {@link cacheDel} from
 * {@link module:lib/cache/cache-primitives} so `@lib/cache/cache-store` remains the single entry
 * point for the cache helpers.
 *
 * @remarks
 * Callers distinguish cache miss from legitimately cached empty results via `shouldCache`.
 *
 * @see {@link module:lib/cache/cache-primitives} for get/set/del
 * @see {@link module:lib/cache/config} for key prefixes and TTL presets
 */
// cacheGet, cacheSet, cacheDel, and CacheGetSetOptions are re-exported via the barrel at
// `@lib/cache`. Import them from there or from `@lib/cache/cache-primitives` directly.

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
type WithCacheOptions<T> = {
  key: string
  getCache: (key: string) => Promise<T | null>
  setCache: (key: string, value: T) => Promise<void>
  compute: () => Promise<T>
  shouldCache?: (result: T) => boolean
}

/**
 * Returns a cached value or computes, optionally stores, and returns a fresh result.
 *
 * @typeParam T - Cached and computed value type
 * @param options - {@link WithCacheOptions} defining key, accessors, compute, and filter
 * @returns The cached value on hit, otherwise the freshly computed `T`. Never returns
 * `null` unless `compute()` resolves to `null` and that value is cached/returned.
 *
 * @throws Propagates errors from `getCache`, `compute`, or `setCache` — partial
 * failures after compute may leave cache stale; callers should treat compute errors
 * as request failures.
 *
 * @example
 * ```typescript
 * const anime = await withCache({
 *   key: 'anime:details:5114',
 *   getCache: cacheGet,
 *   setCache: (k, v) => cacheSet(k, v, { ttlSeconds: CacheTtl.Medium }),
 *   compute: () => repo.findByMalId(5114),
 *   shouldCache: (result) => result !== null,
 * })
 * ```
 *
 * @see {@link cacheGet} and {@link cacheSet} for primitive operations
 */
export const withCache = async <T>({
  key,
  getCache,
  setCache,
  compute,
  shouldCache = () => true,
}: WithCacheOptions<T>): Promise<T> => {
  const cached = await getCache(key)
  if (cached !== null) return cached

  const result = await compute()

  if (shouldCache(result)) {
    await setCache(key, result)
  }

  return result
}
