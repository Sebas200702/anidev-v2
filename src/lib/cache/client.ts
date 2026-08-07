/**
 * @module lib/cache/client
 *
 * Singleton Redis-compatible (Dragonfly) client configured from validated
 * environment variables. All cache read/write operations in the application
 * flow through this instance to ensure consistent credentials and connection
 * settings.
 *
 * @remarks
 * Uses the standard Redis TCP protocol via `ioredis`, compatible with
 * Dragonfly. Network failures surface as rejected promises from `ioredis`
 * methods; the cache primitives layer turns those into graceful misses (see
 * {@link module:lib/cache/cache-primitives}) so an unavailable cache backend
 * never breaks the application.
 *
 * @see {@link module:config/env} for `REDIS_URL`
 * @see {@link module:lib/cache/cache-store} for higher-level cache helpers
 */
import { Redis } from 'ioredis'
import { env } from '@config/env'

/**
 * Shared Dragonfly/Redis client for cache read/write operations.
 *
 * @remarks
 * `@readonly` in practice — do not replace or reconfigure at runtime. Values
 * are JSON-serialized by {@link module:lib/cache/cache-store.cacheSet}.
 *
 * @example
 * ```typescript
 * import { redis } from '@lib/cache/client'
 *
 * await redis.set('health:ping', 'ok', 'EX', 60)
 * const value = await redis.get('health:ping')
 * ```
 *
 * @see {@link module:lib/cache/cache-store} for typed get/set wrappers
 */
export const redis = new Redis(env.REDIS_URL, {
  lazyConnect: true,
  enableOfflineQueue: false,
})
