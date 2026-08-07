/**
 * @module lib/cache/cache-primitives
 *
 * Generic Redis-backed primitives: get, set, and delete. Serializes values as JSON strings and
 * delegates transport to the shared Dragonfly/Redis client. The read-through `withCache` wrapper
 * lives in {@link module:lib/cache/cache-store}.
 *
 * @remarks
 * `cacheGet` returns `null` for missing keys and for falsy Redis responses (empty string, etc.).
 * Values are stored as JSON strings; reads deserialize explicitly.
 *
 * @see {@link module:lib/cache/client} for the underlying Redis instance
 * @see {@link module:lib/cache/config} for key prefixes and TTL presets
 */
import { redis } from '@lib/cache/client'
import { logger } from '@utils/logger-util'
import type { CacheGetSetOptions } from './cache-primitives-types'

export type { CacheGetSetOptions } from './cache-primitives-types'

/**
 * Reads a JSON-deserialized cached value by key.
 *
 * @typeParam T - Expected cached value type; caller responsible for shape correctness.
 * @param key - Non-empty Redis cache key.
 * @returns The cached value when present after `JSON.parse`; `null` when the key
 * is missing, Redis returns a falsy payload, **or the cache backend is
 * unreachable** (logged as a warning, not propagated). Callers must treat
 * `null` as a cache miss and fall back to the database.
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
export const cacheGet = async <T>(key: string): Promise<T | null> => {
  try {
    const raw = await redis.get(key)
    if (!raw) return null

    return JSON.parse(raw) as T
  } catch (error) {
    logger.warn({ err: error, key }, 'Cache GET degraded (cache read failed)')
    return null
  }
}

/**
 * Stores a value in Redis as a JSON string with a required TTL expiry.
 *
 * @typeParam T - Value type to serialize via `JSON.stringify`.
 * @param key - Redis cache key. Overwrites existing value atomically.
 * @param value - Serializable value; `undefined` becomes omitted in JSON.
 * Functions, `BigInt`, and circular structures will cause `JSON.stringify` to throw.
 * @param options - Required TTL configuration via {@link CacheGetSetOptions}.
 * @returns `Promise<void>` resolving when Redis acknowledges the write. If the
 * cache is unreachable the write is skipped and a warning logged — the caller
 * must not assume persistence succeeded.
 *
 * @example
 * ```typescript
 * await cacheSet('anime:list:page:1', { items: [], total: 0 }, { ttlSeconds: CacheTtl.Short })
 * ```
 *
 * @see {@link CacheTtl} for standard expiry durations
 * @see {@link cacheGet} for the corresponding read with the same degradation
 */
export const cacheSet = async <T>(
  key: string,
  value: T,
  { ttlSeconds }: CacheGetSetOptions
): Promise<void> => {
  try {
    const payload = JSON.stringify(value)
    await redis.set(key, payload, 'EX', ttlSeconds)
  } catch (error) {
    logger.warn({ err: error, key }, 'Cache degraded (cache write skipped)')
  }
}

/**
 * Removes a cached entry by key.
 *
 * @param key - Redis cache key to delete. No-op when key does not exist.
 * @returns `Promise<void>` resolving after Redis `DEL` completes. When the cache
 * is unreachable the delete is skipped and a warning logged, leaving stale data
 * to expire via TTL.
 *
 * @example
 * ```typescript
 * await cacheDel('anime:full:5114') // invalidate after admin update
 * ```
 *
 * @see {@link cacheSet} for writing entries
 */
export const cacheDel = async (key: string): Promise<void> => {
  try {
    await redis.del(key)
  } catch (error) {
    logger.warn({ err: error, key }, 'Cache degraded (cache delete skipped)')
  }
}
