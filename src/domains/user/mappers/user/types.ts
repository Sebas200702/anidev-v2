/**
 * @module domains/user/mappers/user/types
 * @remarks Input shape for mapping a persisted user profile row into the
 * API-facing {@link UserProfile}.
 */
import type { UserProfileDB } from '@user/types/user-db-types'

export interface MapUserProfileInput {
  userProfile: UserProfileDB
}
