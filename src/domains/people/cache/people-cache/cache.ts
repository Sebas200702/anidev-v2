/**
 * Stale-while-error cache shared by the people services.
 *
 * @module domains/people/cache/people-cache/cache
 */
import { cacheGet, cacheSet, withStaleCache } from '@lib/cache'
import { CacheKeyPrefix, CacheTtl } from '@lib/cache/config'
import { stableStringify } from '@lib/cache/stable-stringify'
import type { StaleResult } from '@lib/cache/cache-store-types'

type Entity = 'character' | 'person'

const PREFIX: Record<Entity, CacheKeyPrefix> = {
  character: CacheKeyPrefix.PeopleCharacter,
  person: CacheKeyPrefix.PeoplePerson,
}

/**
 * Builds a people cache key: `<prefix>:<view>:<stable args>`.
 *
 * @example
 * ```ts
 * peopleCacheKey('character', 'profile', 417) // 'people:character:profile:417'
 * ```
 */
export const peopleCacheKey = (entity: Entity, view: string, args: unknown) =>
  `${PREFIX[entity]}:${view}:${stableStringify(args)}`

/**
 * Serves a payload from cache with a stale fallback.
 *
 * @param key - Fresh key (stale copy under `${key}:stale`)
 * @param ttlSeconds - Fresh TTL (`CacheTtl.Long` for profiles,
 *   `CacheTtl.Medium` for searches and lists)
 * @param compute - Builds the payload on a miss
 * @returns `{ value, isStale }`
 */
export const withPeopleCache = <T>(
  key: string,
  ttlSeconds: number,
  compute: () => Promise<T>
): Promise<StaleResult<T>> =>
  withStaleCache({
    key,
    staleKey: `${key}:stale`,
    getCache: () => cacheGet<T>(key),
    getStaleCache: (staleKey) => cacheGet<T>(staleKey),
    setCache: (_, value) => cacheSet(key, value, { ttlSeconds }),
    setStaleCache: (staleKey, value) =>
      cacheSet(staleKey, value, { ttlSeconds: CacheTtl.Stale }),
    compute,
  })
