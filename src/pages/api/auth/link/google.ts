/**
 * Google account linking endpoint.
 *
 * @module pages/api/auth/link/google
 *
 * **Route:** `GET /api/auth/link/google?callbackURL=/path` — authenticated.
 *
 * Links Google to the signed-in account (the only way to attach Google to an
 * existing password account). `401 AUTH_REQUIRED` without a session.
 *
 * @see {@link googleSignInService.link}
 */
import type { APIRoute } from 'astro'
import { googleSignInService } from '@auth/services/google-sign-in'
import { requireAuthSession } from '@auth/utils'
import { withOAuthErrors } from '@auth/utils/oauth-redirect'

/** Starts the Google linking flow for the current user. */
export const GET: APIRoute = ({ request, locals }) =>
  withOAuthErrors(async () => {
    requireAuthSession(locals)
    return googleSignInService.link(request)
  })
