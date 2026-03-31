import { mapUserProfile } from '@/domains/user/mappers/user'
import { userRepository } from '@/domains/user/repositories/user'
import { userPolicies } from '@/domains/user/policies/user'
import { withCache } from '@/core/cache'
import { userProfileCache } from '@/domains/user/cache'
import { userNotFound, userUnauthorized } from '@/domains/user/errors'

export const userService = {
  async getUserProfile({
    userId,
    targetId,
  }: {
    userId: string
    targetId: string
  }) {
    return withCache({
      key: userProfileCache.key(targetId),
      getCache: () => userProfileCache.get(targetId),
      setCache: (_, userProfile) => userProfileCache.set(targetId, userProfile),

      compute: async () => {
        if (!userPolicies.canViewUserProfile({ userId, targetId })) {
          throw userUnauthorized(targetId)
        }

        const userProfileDB = await userRepository.getUserProfileById(targetId)

        if (!userProfileDB) {
          throw userNotFound(targetId)
        }

        return mapUserProfile({
          userProfile: userProfileDB,
        })
      },
    })
  },
}
