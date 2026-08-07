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

const MAX_RECONNECT_ATTEMPTS = 5
const INITIAL_RETRY_DELAY_MS = 250
const MAX_RETRY_DELAY_MS = 5_000

/**
 * Bounded reconnection policy for the Redis client.
 *
 * @remarks
 * ioredis reconnects automatically after a lost connection. Without a bound the
 * client retries forever, hammering a down Dragonfly instance and amplifying
 * error logging. This strategy applies exponential backoff and gives up after
 * `MAX_RECONNECT_ATTEMPTS`, returning `null` so ioredis stops reconnecting and
 * the cache degrades gracefully instead of retrying indefinitely.
 *
 * @param attempt - Zero-indexed reconnection attempt counter from ioredis.
 * @returns Delay in milliseconds before the next attempt, or `null` to give up.
 */
export function retryStrategy(attempt: number): number | null {
  if (attempt > MAX_RECONNECT_ATTEMPTS) {
    logger.warn({ attempt }, 'Redis/Dragonfly reconnect limit reached')
    return null
  }
  return Math.min(
    INITIAL_RETRY_DELAY_MS * 2 ** (attempt - 1),
    MAX_RETRY_DELAY_MS
  )
}

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
  retryStrategy,
})

// Track consecutive errors so a down backend logs once instead of per event.
let errorCount = 0
redis.on('error', (err) => {
  errorCount += 1
  if (errorCount === 1) {
    logger.error({ err }, 'Redis/Dragonfly cache client error')
  } else {
    logger.warn({ err, errorCount }, 'Redis/Dragonfly cache client errors')
  }
  if (errorCount > MAX_RECONNECT_ATTEMPTS) errorCount = 0
})

// Connect eagerly so the socket reaches `ready` before the first cache
// operation; with `enableOfflineQueue: false` a still-`wait` command is
// rejected, making the first get/set always degrade (issue #82). The failure
// is handled here (logged, not rethrown) so a cache backend down at boot
// degrades gracefully instead of surfacing an unhandled rejection.
try {
  await redis.connect()
} catch (err) {
  logger.warn(
    { err },
    'Redis/Dragonfly initial connect failed; cache will degrade'
  )
}
