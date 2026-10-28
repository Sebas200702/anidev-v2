/**
 * Character portrait as profile avatar.
 *
 * @module pages/api/user/[userId]/avatar/character
 *
 * **Route:** `PUT /api/user/:userId/avatar/character` — authenticated, owner
 * only. Body `{ characterId }`. Sets the avatar to the catalog's `/media`
 * portrait and deletes any uploaded avatar. Works without storage.
 *
 * | Status | Code | When |
 * |--------|------|------|
 * | 400 | `VALIDATION_ERROR` | Bad body, unknown or provisional character |
 * | 401 | `AUTH_REQUIRED` | No session |
 * | 403 | `AUTH_FORBIDDEN` | `:userId` is not the session user |
 * | 404 | `USER_NOT_FOUND` | No profile |
 */
import type { APIContext } from 'astro'
import { withErrorHandling } from '@http/with-error-handling'
import { withZodValidation } from '@http/with-validation'
import { pickCharacterAvatarSchema } from '@user/schemas/profile-image-schema'
import { userProfileResponseSchema } from '@user/schemas/user-schema'
import { profileImageService } from '@user/services/profile-image'
import { profileResult, requireOwner } from '../_profile-image-handlers'

type Validated = { body: { characterId: number } }

/** Picks a character portrait (see module docs). */
export const PUT: (context: APIContext) => Promise<Response> =
  withZodValidation(pickCharacterAvatarSchema)(
    withErrorHandling(
      async (context: APIContext & { validated: Validated }) =>
        profileResult(
          await profileImageService.pickCharacterAvatar({
            ...requireOwner(context),
            characterId: context.validated.body.characterId,
          })
        ),
      { responseSchema: userProfileResponseSchema }
    )
  )
