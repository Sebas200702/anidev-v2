import type { PolicyParameters } from '@/domains/user/types/user-polices'

export const userPolicies = {
  canViewUserProfile: (_: PolicyParameters) => {
    return true
  },
  canEditUserProfile: ({ userId, targetId }: PolicyParameters) => {
    return userId === targetId
  },
  canViewUserPreferences: ({ userId, targetId }: PolicyParameters) => {
    return userId === targetId
  },
  canEditUserPreferences: ({ userId, targetId }: PolicyParameters) => {
    return userId === targetId
  },
  canViewUserHistory: ({ userId, targetId }: PolicyParameters) => {
    return userId === targetId
  },
  canEditUserHistory: ({ userId, targetId }: PolicyParameters) => {
    return userId === targetId
  },
}
