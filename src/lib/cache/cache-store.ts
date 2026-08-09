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

import type {
  StaleResult,
  WithCacheOptions,
  WithStaleCacheOptions,
} from './cache-store-types'
import { InfraError } from '@shared/errors/app-error'

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

/**
 * Returns a cached or computed value, falling back to a last-known-good
 * snapshot when a fresh compute fails with an {@link InfraError}.
 *
 * @typeParam T - Cached and computed value type
 * @param options - {@link WithStaleCacheOptions} defining both keys, accessors,
 * compute, and optional caching predicate
 * @returns A {@link StaleResult}: `{ value, isStale: false }` on cache hit or
 * successful compute; `{ value: staleSnapshot, isStale: true }` when compute
 * fails with an {@link InfraError} and a `:stale` snapshot exists.
 *
 * @throws Rethrows the original {@link InfraError} when compute fails and no
 * snapshot exists; rethrows any non-infra error (e.g. domain errors) untouched.
 *
 * @remarks
 * On a successful compute both keys are written when `shouldCache` allows it:
 * the fresh key with the normal TTL and the companion `staleKey` with a long
 * TTL (e.g. {@link CacheTtl.Stale}) so later infra failures can still be served.
 *
 * @example
 * ```typescript
 * const { value, isStale } = await withStaleCache({
 *   key: 'anime:details:5114',
 *   staleKey: 'anime:details:5114:stale',
 *   getCache: cacheGet,
 *   getStaleCache: cacheGet,
 *   setCache: (k, v) => cacheSet(k, v, { ttlSeconds: CacheTtl.Medium }),
 *   setStaleCache: (k, v) => cacheSet(k, v, { ttlSeconds: CacheTtl.Stale }),
 *   compute: () => repo.findByMalId(5114),
 * })
 * ```
 *
 * @see {@link cacheGet} and {@link cacheSet} for primitive operations
 * @see {@link StaleResult} for the return envelope
 */
export const withStaleCache = async <T>({
  key,
  staleKey,
  getCache,
  getStaleCache,
  setCache,
  setStaleCache,
  compute,
  shouldCache = () => true,
}: WithStaleCacheOptions<T>): Promise<StaleResult<T>> => {
  const cached = await getCache(key)
  if (cached !== null) return { value: cached, isStale: false }

  try {
    const result = await compute()

    if (shouldCache(result)) {
      await setCache(key, result)
      await setStaleCache(staleKey, result)
    }

    return { value: result, isStale: false }
  } catch (error) {
    if (error instanceof InfraError) {
      const stale = await getStaleCache(staleKey)
      if (stale !== null) return { value: stale, isStale: true }
    }
    throw error
  }
}
