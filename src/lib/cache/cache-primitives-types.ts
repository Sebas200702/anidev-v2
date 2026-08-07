/**
 * Types for the generic Redis-backed cache primitives.
 *
 * @module lib/cache/cache-primitives-types
 * @remarks
 * Consumed by {@link module:lib/cache/cache-primitives} to shape the required TTL
 * options passed to {@link cacheSet}.
 *
 * @see {@link cacheSet} for the write primitive
 * @see {@link module:lib/cache/config} for TTL presets
 */

import type { CacheTtl } from '@lib/cache/config'

/**
 * Options for {@link cacheSet} controlling key expiry.
 *
 * @property ttlSeconds - Required expiry in seconds. Every write stores the key
 * with Redis `EX` so {@link cacheDel} can rely on a bounded lifetime even when
 * the delete is suppressed by a degraded backend.
 */
export interface CacheGetSetOptions {
  ttlSeconds: CacheTtl
}
