import type { UserProfileDB } from '@/domains/user/types/user-db'
import type { UserProfile, UserPreferences } from '@/domains/user/types/user'

export const mapUserProfile = ({
  userProfile,
}: {
  userProfile: UserProfileDB
}): UserProfile => {
  const preferences: UserPreferences = {
    favoriteAnimes:
      userProfile.favoriteAnimes
        ?.split(',')
        .map((id) => Number.parseInt(id.trim()))
        .filter(Boolean) || [],
    frequency: (userProfile.frequency ??
      undefined) as UserPreferences['frequency'],
    fanaticLevel: (userProfile.fanaticLevel ??
      undefined) as UserPreferences['fanaticLevel'],
    preferredFormat: userProfile.preferredFormat ?? undefined,
    favoriteGenres:
      userProfile.favoriteGenres
        ?.split(',')
        .map((genre) => Number.parseInt(genre.trim()))
        .filter(Boolean) || [],
    favoriteStudios:
      userProfile.favoriteStudios
        ?.split(',')
        .map((studio) => Number.parseInt(studio.trim()))
        .filter(Boolean) || [],
  }
  return {
    id: userProfile.id,
    avatar: userProfile.avatar ?? '/placeholder.webp',
    name: userProfile.name,
    lastName: userProfile.lastName,
    birthday: userProfile.birthday!,
    gender: userProfile.gender as UserProfile['gender'],
    preferences,
    history: {
      watchedAnimes:
        userProfile.watchedAnimes
          ?.split(',')
          .map((id) => Number.parseInt(id.trim()))
          .filter(Boolean) || [],
    },
  }
}
