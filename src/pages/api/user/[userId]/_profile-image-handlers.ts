/**
 * Shared handlers for the profile avatar and banner routes.
 *
 * @module pages/api/user/[userId]/_profile-image-handlers
 * @remarks
 * The `_` prefix keeps Astro from routing this module. Every handler checks
 * the session (401) and ownership (403) first; uploads then check storage
 * (404) before the body is read, so rejected callers never make the server
 * buffer a file.
 */
import type { APIContext } from 'astro'
import { requireAuthSession } from '@auth/utils'
import type { User } from '@lib/auth/server'
import { isStorageEnabled } from '@lib/storage'
import { authForbidden } from '@shared/errors/auth-errors'
import { storageNotConfigured } from '@user/errors'
import type { UserProfile } from '@user/schemas/user-schema'
import { profileImageService } from '@user/services/profile-image'
import { readImageUpload } from '@user/utils/image-upload'
import type { ProfileImageKind } from '@user/utils/profile-image'

/** Session user id and target profile id, once ownership is proven. */
export const requireOwner = ({ locals, params }: APIContext) => {
  const sessionId = requireAuthSession({ user: locals.user as User | null })
  const targetId = String(params.userId)
  if (targetId !== sessionId) throw authForbidden({ targetId, sessionId })
  return { userId: sessionId, targetId }
}

/** Success envelope: the updated profile, never cached. */
export const profileResult = (profile: UserProfile) => ({
  data: profile,
  status: 200,
  meta: {},
  headers: new Headers({ 'Cache-Control': 'private, no-store' }),
})

/**
 * `PUT` handler that uploads a new image of `kind`.
 *
 * @param kind - `avatar` or `banner`
 */
export const uploadProfileImage =
  (kind: ProfileImageKind) => async (context: APIContext) => {
    const actor = requireOwner(context)
    if (!isStorageEnabled()) throw storageNotConfigured()
    const upload = await readImageUpload(context.request)
    return profileResult(
      await profileImageService.upload({ ...actor, kind, upload })
    )
  }

/**
 * `DELETE` handler that clears the image of `kind`.
 *
 * @param kind - `avatar` or `banner`
 */
export const resetProfileImage =
  (kind: ProfileImageKind) => async (context: APIContext) =>
    profileResult(
      await profileImageService.reset({ ...requireOwner(context), kind })
    )
