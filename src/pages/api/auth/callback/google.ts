/**
 * Google OAuth callback endpoint.
 *
 * @module pages/api/auth/callback/google
 *
 * **Route:** `GET /api/auth/callback/google` — public (Google redirects here).
 *
 * Delegates to Better Auth, which sets the session cookie and redirects to
 * the `callbackURL`. A same-email password account is never opened: the
 * redirect carries `error=ACCOUNT_EXISTS_USE_PASSWORD` instead.
 *
 * @see {@link googleSignInService.callback}
 */
import type { APIRoute } from 'astro'
import { googleSignInService } from '@auth/services/google-sign-in'
import { withOAuthErrors } from '@auth/utils/oauth-redirect'

/** Completes Google sign-in. */
export const GET: APIRoute = ({ request }) =>
  withOAuthErrors(() => googleSignInService.callback(request))
