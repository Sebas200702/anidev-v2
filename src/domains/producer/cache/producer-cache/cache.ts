/**
 * Stale-while-error cache shared by the producer services.
 *
 * @module domains/producer/cache/producer-cache/cache
 */
import { cacheGet, cacheSet, withStaleCache } from '@lib/cache'
import { CacheKeyPrefix, CacheTtl } from '@lib/cache/config'
import { stableStringify } from '@lib/cache/stable-stringify'
import type { StaleResult } from '@lib/cache/cache-store-types'
import type { ProducerListQuery } from '@producer/types'

/** Cache keys of the producer payloads. */
export const producerCacheKeys = {
  list: (query: ProducerListQuery) =>
    `${CacheKeyPrefix.ProducerList}:${stableStringify(query)}`,
  details: (malId: number) => `${CacheKeyPrefix.ProducerDetails}:${malId}`,
}

/**
 * Serves a producer payload from cache for a day, with a stale fallback.
 *
 * @remarks Credits change only with catalog ingestion, so a long TTL is safe.
 * @param key - Fresh key (stale copy under `${key}:stale`)
 * @param compute - Builds the payload on a miss
 * @returns `{ value, isStale }`
 */
export const withProducerCache = <T>(
  key: string,
  compute: () => Promise<T>
): Promise<StaleResult<T>> =>
  withStaleCache({
    key,
    staleKey: `${key}:stale`,
    getCache: () => cacheGet<T>(key),
    getStaleCache: (staleKey) => cacheGet<T>(staleKey),
    setCache: (_, value) => cacheSet(key, value, { ttlSeconds: CacheTtl.Long }),
    setStaleCache: (staleKey, value) =>
      cacheSet(staleKey, value, { ttlSeconds: CacheTtl.Stale }),
    compute,
  })
