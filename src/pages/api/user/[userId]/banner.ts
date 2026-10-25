/**
 * Profile banner upload and reset.
 *
 * @module pages/api/user/[userId]/banner
 *
 * **Routes** (authenticated, owner only):
 * - `PUT /api/user/:userId/banner` — `multipart/form-data` with `file`
 *   (JPEG, PNG, WebP, AVIF or GIF, ≤ 5 MiB) and an optional crop box
 *   (`x`, `y`, `width`, `height`, all four or none). Stored as WebP.
 * - `DELETE /api/user/:userId/banner` — clears the banner.
 *
 * | Status | Code | When |
 * |--------|------|------|
 * | 400 | `VALIDATION_ERROR` | Missing/empty `file`, or a bad crop box |
 * | 401 | `AUTH_REQUIRED` | No session |
 * | 403 | `AUTH_FORBIDDEN` | `:userId` is not the session user |
 * | 404 | `STORAGE_NOT_CONFIGURED` / `USER_NOT_FOUND` | No `S3_*` (upload only) / no profile |
 * | 413 | `REQUEST_TOO_LARGE` | Body or file over 5 MiB |
 * | 415 | `UNSUPPORTED_MEDIA_TYPE` | Not multipart, or not an accepted image |
 * | 429 | `RATE_LIMITED` | More than 10 uploads per minute per IP |
 *
 * @example
 * ```bash
 * curl -X PUT "http://localhost:4321/api/user/<id>/banner" -b cookies.txt \
 *   -F file=@picture.jpg -F x=0 -F y=0 -F width=800 -F height=800
 * ```
 */
import type { APIContext } from 'astro'
import { withErrorHandling } from '@http/with-error-handling'
import { userProfileResponseSchema } from '@user/schemas/user-schema'
import {
  resetProfileImage,
  uploadProfileImage,
} from './_profile-image-handlers'

/** Uploads a new banner (see module docs). */
export const PUT: (context: APIContext) => Promise<Response> =
  withErrorHandling(uploadProfileImage('banner'), {
    responseSchema: userProfileResponseSchema,
  })

/** Clears the banner and deletes any uploaded object. */
export const DELETE: (context: APIContext) => Promise<Response> =
  withErrorHandling(resetProfileImage('banner'), {
    responseSchema: userProfileResponseSchema,
  })
