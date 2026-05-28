/**
 * @module lib/cache/cache-store
 *
 * Generic Redis-backed cache helpers implementing get, set, delete, and a
 * read-through `withCache` wrapper. Serializes values as JSON strings and
 * delegates transport to the shared Upstash client.
 *
 * @remarks
 * `cacheGet` returns `null` for missing keys and for falsy Redis responses
 * (empty string, etc.). Callers distinguish cache miss from legitimately
 * cached empty results via `shouldCache` in {@link withCache}. Upstash/network
 * errors propagate as rejected promises without translation.
 *
 * @see {@link module:lib/cache/client} for the underlying Redis instance
 * @see {@link module:lib/cache/config} for key prefixes and TTL presets
 */
import { redis } from '@lib/cache/client'

/**
 * Options for {@link cacheSet} controlling key expiry.
 *
 * @property ttlSeconds - Optional expiry in seconds. When omitted or `<= 0`,
 * the key persists until explicit {@link cacheDel} or Redis eviction policy.
 */
type CacheGetSetOptions = {
  ttlSeconds?: number
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
type WithCacheOptions<T> = {
  key: string
  getCache: (key: string) => Promise<T | null>
  setCache: (key: string, value: T) => Promise<void>
  compute: () => Promise<T>
  shouldCache?: (result: T) => boolean
}

/**
 * Reads a JSON-deserialized cached value by key.
 *
 * @typeParam T - Expected cached value type; caller responsible for shape correctness.
 * @param key - Non-empty Redis cache key. Invalid keys behave per Upstash rules.
 * @returns The cached value when present and truthy after Redis `GET`; `null`
 * when the key is missing or Redis returns a falsy payload. Does not distinguish
 * "cached null" from miss unless callers encode sentinels in `T`.
 *
 * @throws Rejects when Upstash REST request fails (network, auth, rate limit).
 *
 * @example
 * ```typescript
 * type AnimeDetail = { malId: number; title: string }
 * const detail = await cacheGet<AnimeDetail>('anime:details:5114')
 * if (detail === null) {
 *   // cache miss — fetch from database
 * }
 * ```
 *
 * @see {@link cacheSet} for writing values
 * @see {@link withCache} for read-through pattern
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  const raw = await redis.get<T>(key)
  if (!raw) return null

  return raw
}

/**
 * Stores a value in Redis as a JSON string, optionally with TTL expiry.
 *
 * @typeParam T - Value type to serialize via `JSON.stringify`.
 * @param key - Redis cache key. Overwrites existing value atomically.
 * @param value - Serializable value; `undefined` becomes omitted in JSON.
 * Functions, `BigInt`, and circular structures will cause `JSON.stringify` to throw.
 * @param options - Optional TTL configuration via {@link CacheGetSetOptions}.
 * @returns `Promise<void>` resolving when Upstash acknowledges the write.
 *
 * @throws Rejects on non-serializable `value`, Upstash errors, or invalid credentials.
 * @throws {TypeError} When `JSON.stringify` fails for exotic values.
 *
 * @example
 * ```typescript
 * await cacheSet('anime:list:page:1', { items: [], total: 0 }, { ttlSeconds: 3600 })
 * ```
 *
 * @see {@link CacheTtl} for standard expiry durations
 */
export async function cacheSet<T>(
  key: string,
  value: T,
  { ttlSeconds }: CacheGetSetOptions = {}
): Promise<void> {
  const payload = JSON.stringify(value)

  if (ttlSeconds && ttlSeconds > 0) {
    await redis.set(key, payload, { ex: ttlSeconds })
  } else {
    await redis.set(key, payload)
  }
}

/**
 * Removes a cached entry by key.
 *
 * @param key - Redis cache key to delete. No-op when key does not exist.
 * @returns `Promise<void>` resolving after Upstash `DEL` completes.
 *
 * @throws Rejects on Upstash transport or authentication failures.
 *
 * @example
 * ```typescript
 * await cacheDel('anime:full:5114') // invalidate after admin update
 * ```
 *
 * @see {@link cacheSet} for writing entries
 */
export async function cacheDel(key: string): Promise<void> {
  await redis.del(key)
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
