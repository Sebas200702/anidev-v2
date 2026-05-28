/**
 * @module lib/cache/client
 *
 * Singleton Upstash Redis REST client configured from validated environment
 * variables. All cache read/write operations in the application flow through
 * this instance to ensure consistent credentials and connection settings.
 *
 * @remarks
 * Uses HTTP REST rather than persistent TCP — suitable for serverless and
 * edge deployments. Network failures surface as rejected promises from
 * `@upstash/redis` methods; callers should handle or log at the domain layer.
 *
 * @see {@link module:config/env} for `UPSTASH_REDIS_REST_URL` and token
 * @see {@link module:lib/cache/cache-store} for higher-level cache helpers
 */
import { Redis } from '@upstash/redis'
import { env } from '@config/env'

/**
 * Shared Upstash Redis client for cache read/write operations.
 *
 * @remarks
 * `@readonly` in practice — do not replace or reconfigure at runtime. Values
 * are JSON-serialized by {@link module:lib/cache/cache-store.cacheSet}.
 *
 * @example
 * ```typescript
 * import { redis } from '@lib/cache/client'
 *
 * await redis.set('health:ping', 'ok', { ex: 60 })
 * const value = await redis.get<string>('health:ping')
 * ```
 *
 * @see {@link module:lib/cache/cache-store} for typed get/set wrappers
 */
export const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
})
