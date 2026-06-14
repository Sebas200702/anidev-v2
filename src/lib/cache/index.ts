/**
 * @module lib/cache
 *
 * Redis caching layer backed by Upstash REST API. Provides a shared client,
 * namespaced key prefixes, TTL presets, and generic read-through helpers used
 * by domain cache modules (anime list, details, staff, etc.).
 *
 * @remarks
 * Import from this barrel when implementing or consuming cache utilities across
 * domains. Import `./config` alone for key/TTL constants without pulling the
 * Redis client into lightweight modules.
 *
 * **Re-exports:**
 * - `./cache-primitives` — `cacheGet`, `cacheSet`, `cacheDel`
 * - `./cache-store` — `withCache`
 * - `./client` — shared `redis` Upstash instance
 * - `./config` — `CacheKeyPrefix`, `CacheTtl` enums
 *
 * @see {@link module:config/env} for Upstash credentials
 * @see {@link module:lib/cache/cache-store} for read-through pattern
 */

export type { CacheGetSetOptions } from './cache-primitives'
export { cacheGet, cacheSet, cacheDel } from './cache-primitives'
export { withCache } from './cache-store'
export { redis } from './client'
export { CacheKeyPrefix, CacheTtl } from './config'
