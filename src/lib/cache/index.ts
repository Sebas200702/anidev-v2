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
 * - `./cache-store` — `cacheGet`, `cacheSet`, `cacheDel`, `withCache`
 * - `./client` — shared `redis` Upstash instance
 * - `./config` — `CacheKeyPrefix`, `CacheTtl` enums
 *
 * @see {@link module:config/env} for Upstash credentials
 * @see {@link module:lib/cache/cache-store} for read-through pattern
 */
export * from './cache-primitives'
export * from './cache-store'
export * from './client'
export * from './config'
