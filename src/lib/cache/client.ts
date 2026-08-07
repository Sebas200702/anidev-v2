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
 * Dragonfly. The client connects eagerly at module load (so the first cache
 * operation is not degraded by a still-`wait`-ing socket), and registers an
 * `error` listener that de-duplicates/reports socket errors instead of letting
 * an unhandled `error` event crash the process. Network failures still surface
 * as rejected promises from `ioredis` methods; the cache primitives layer turns
 * those into graceful misses (see {@link module:lib/cache/cache-primitives}) so
 * an unavailable cache backend never breaks the application.
 *
 * @see {@link module:config/env} for `REDIS_URL`
 * @see {@link module:lib/cache/cache-store} for higher-level cache helpers
 */
import { Redis } from 'ioredis'
import { env } from '@config/env'
import { logger } from '@utils/logger-util'

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

redis.on('error', (err) => {
  logger.error({ err }, 'Redis/Dragonfly cache client error')
})

// Connect eagerly so the socket reaches `ready` before the first cache
// operation; with `enableOfflineQueue: false` a still-`wait` command is
// rejected, making the first get/set always degrade (issue #82).
void redis.connect()
