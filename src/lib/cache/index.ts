/**
 * @module lib/cache
 *
 * Redis caching layer backed by Dragonfly (Redis-compatible). Provides a shared
 * client, namespaced key prefixes, TTL presets, and generic read-through helpers
 * used by domain cache modules (anime list, details, staff, etc.).
 *
 * @remarks
 * Import from this barrel when implementing or consuming cache utilities across
 * domains. Import `./config` alone for key/TTL constants without pulling the
 * Redis client into lightweight modules.
 *
 * **Re-exports:**
 * - `./cache-primitives` — `cacheGet`, `cacheSet`, `cacheDel`
 * - `./cache-store` — `withCache`, `withStaleCache`, `StaleResult`
 * - `./client` — shared `redis` Dragonfly instance
 * - `./config` — `CacheKeyPrefix`, `CacheTtl` enums
 *
 * @see {@link module:config/env} for `REDIS_URL`
 * @see {@link module:lib/cache/cache-store} for read-through pattern
 */

export type { CacheGetSetOptions } from './cache-primitives'
export { cacheGet, cacheSet, cacheDel } from './cache-primitives'
export type { StaleResult } from './cache-store-types'
export { withCache, withStaleCache } from './cache-store'
export { redis } from './client'
export { CacheKeyPrefix, CacheTtl } from './config'
