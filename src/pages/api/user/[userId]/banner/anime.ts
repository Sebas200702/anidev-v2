/**
 * Anime banner as profile banner.
 *
 * @module pages/api/user/[userId]/banner/anime
 *
 * **Route:** `PUT /api/user/:userId/banner/anime` — authenticated, owner
 * only. Body `{ animeId }`. Sets the banner to the catalog's `/media` anime
 * banner and deletes any uploaded banner. Works without storage.
 *
 * | Status | Code | When |
 * |--------|------|------|
 * | 400 | `VALIDATION_ERROR` | Bad body, unknown/adult anime or no banner media |
 * | 401 | `AUTH_REQUIRED` | No session |
 * | 403 | `AUTH_FORBIDDEN` | `:userId` is not the session user |
 * | 404 | `USER_NOT_FOUND` | No profile |
 */
import type { APIContext } from 'astro'
import { withErrorHandling } from '@http/with-error-handling'
import { withZodValidation } from '@http/with-validation'
import { pickAnimeBannerSchema } from '@user/schemas/profile-image-schema'
import { userProfileResponseSchema } from '@user/schemas/user-schema'
import { profileImageService } from '@user/services/profile-image'
import { profileResult, requireOwner } from '../_profile-image-handlers'

type Validated = { body: { animeId: number } }

/** Picks an anime banner (see module docs). */
export const PUT: (context: APIContext) => Promise<Response> =
  withZodValidation(pickAnimeBannerSchema)(
    withErrorHandling(
      async (context: APIContext & { validated: Validated }) =>
        profileResult(
          await profileImageService.pickAnimeBanner({
            ...requireOwner(context),
            animeId: context.validated.body.animeId,
          })
        ),
      { responseSchema: userProfileResponseSchema }
    )
  )
