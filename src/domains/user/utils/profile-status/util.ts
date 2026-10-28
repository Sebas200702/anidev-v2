/**
 * Onboarding status of a user's profile.
 *
 * @module domains/user/utils/profile-status/util
 */

/** Where the user stands in onboarding. */
export type ProfileStatus = 'missing' | 'incomplete' | 'complete'

/**
 * Derives the onboarding status from the profile row.
 *
 * @param profile - The user's profile row, or `undefined` when none exists
 * @returns `missing` without a row; `incomplete` while gender or birthday is
 *   empty (e.g. right after Google sign-in); `complete` otherwise
 */
export const resolveProfileStatus = (
  profile: { gender: string | null; birthday: string | null } | undefined
): ProfileStatus => {
  if (!profile) return 'missing'
  return profile.gender && profile.birthday ? 'complete' : 'incomplete'
}
