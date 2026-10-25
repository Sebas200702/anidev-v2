/**
 * Google sign-in start endpoint.
 *
 * @module pages/api/auth/sign-in/google
 *
 * **Route:** `GET /api/auth/sign-in/google?callbackURL=/path` — public.
 *
 * Answers `302` to Google's consent screen and sets the OAuth state cookie.
 * `callbackURL` must be a same-site path; anything else becomes `/`.
 * `404 PROVIDER_NOT_CONFIGURED` when the Google credentials are not set.
 *
 * @see {@link googleSignInService.start}
 */
import type { APIRoute } from 'astro'
import { googleSignInService } from '@auth/services/google-sign-in'
import { withOAuthErrors } from '@auth/utils/oauth-redirect'

/** Starts Google sign-in. */
export const GET: APIRoute = ({ request }) =>
  withOAuthErrors(() => googleSignInService.start(request))
