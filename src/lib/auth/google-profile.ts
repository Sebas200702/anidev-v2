/**
 * Profile bootstrap for users created through Google sign-in.
 *
 * @module lib/auth/google-profile
 * @remarks
 * Runs from the Better Auth `account.create.after` hook. Lives in `lib/auth`
 * (not the user domain) because `src/lib` may not import from `src/domains`;
 * it writes the `profile` row directly with the same idempotent shape the
 * user repository uses (`id = userId`, `ON CONFLICT DO NOTHING`).
 */
import { db } from '@db/client'
import { user } from '@db/schemas/auth-schema'
import { profile } from '@db/schemas/profile'
import { logger } from '@utils/logger-util'
import { eq } from 'drizzle-orm'

/** Better Auth provider id of Google accounts. */
export const GOOGLE_PROVIDER_ID = 'google'

/**
 * Builds the initial profile of a Google user.
 *
 * @param account - New user's `{ id, name, image }`
 * @returns Profile insert values: first word as name, the rest as last name,
 *   the Google picture as avatar
 *
 * @example
 * ```ts
 * buildGoogleProfile({ id: 'u1', name: 'Ada Lovelace', image: null })
 * // { id: 'u1', userId: 'u1', name: 'Ada', lastName: 'Lovelace', avatar: null }
 * ```
 */
export const buildGoogleProfile = ({
  id,
  name,
  image,
}: {
  id: string
  name: string
  image: string | null
}) => {
  const [first = '', ...rest] = name.trim().split(/\s+/)
  return {
    id,
    userId: id,
    name: first || 'User',
    lastName: rest.join(' '),
    avatar: image,
  }
}

/**
 * Creates the profile of a Google user unless one already exists.
 *
 * @remarks Never throws: a failure is logged and the client recovers through
 * `profileStatus: 'missing'` in the session.
 * @param account - The account row Better Auth just created
 */
export const bootstrapGoogleProfile = async (account: {
  providerId: string
  userId: string
}): Promise<void> => {
  if (account.providerId !== GOOGLE_PROVIDER_ID) return
  try {
    const [owner] = await db
      .select({ id: user.id, name: user.name, image: user.image })
      .from(user)
      .where(eq(user.id, account.userId))
      .limit(1)
    if (!owner) return
    await db
      .insert(profile)
      .values(buildGoogleProfile(owner))
      .onConflictDoNothing({ target: profile.id })
  } catch (error) {
    logger.error(
      { err: error, userId: account.userId },
      'Google profile bootstrap failed'
    )
  }
}
