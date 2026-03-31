import { cacheGet, cacheSet } from '@/core/cache'
import { CacheKeyPrefix, CacheTtl } from '@/core/cache/config'
import type { UserProfile } from '@/domains/user/types/user'
export const userProfileCache = {
  key(userId: string) {
    return `${CacheKeyPrefix.UserProfile}:${userId}`
  },

  async get(userId: string) {
    return cacheGet<UserProfile>(this.key(userId))
  },

  async set(userId: string, value: UserProfile) {
    return cacheSet<UserProfile>(this.key(userId), value, {
      ttlSeconds: CacheTtl.Medium,
    })
  },
}
