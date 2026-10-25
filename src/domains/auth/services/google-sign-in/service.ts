/**
 * Google sign-in and linking use cases.
 *
 * @module domains/auth/services/google-sign-in/service
 * @remarks
 * Wraps Better Auth's social endpoints so routes stay thin: provider check,
 * open-redirect guard on `callbackURL`, and JSON-to-redirect conversion.
 */
import { config } from '@/config'
import { isGoogleEnabled } from '@auth/config'
import { sanitizeCallbackURL } from '@auth/utils/callback-url'
import {
  mapCallbackRedirect,
  providerNotConfigured,
  toRedirect,
} from '@auth/utils/oauth-redirect'
import { auth } from '@lib/auth/server'

const PROVIDER = 'google'

/** Absolute same-site destination for Better Auth (`callbackURL` / error URL). */
const destination = (rawCallbackURL: string | null) =>
  `${config.baseUrl}${sanitizeCallbackURL(rawCallbackURL, config.baseUrl)}`

const assertEnabled = () => {
  if (!isGoogleEnabled()) throw providerNotConfigured(PROVIDER)
}

/** Google sign-in flow (start, callback, explicit link). */
export const googleSignInService = {
  /**
   * Starts the consent flow.
   *
   * @param request - Incoming request (`?callbackURL=` read from it)
   * @returns `302` to Google with the OAuth state cookie
   * @throws {DomainError} `PROVIDER_NOT_CONFIGURED`
   */
  async start(request: Request): Promise<Response> {
    assertEnabled()
    const target = destination(
      new URL(request.url).searchParams.get('callbackURL')
    )
    const response = await auth.api.signInSocial({
      body: {
        provider: PROVIDER,
        callbackURL: target,
        errorCallbackURL: target,
      },
      headers: request.headers,
      asResponse: true,
    })
    return toRedirect(response, target)
  },

  /**
   * Completes the flow; an unlinked same-email account becomes
   * `error=ACCOUNT_EXISTS_USE_PASSWORD` on the destination.
   *
   * @param request - Google's redirect back to the callback route
   * @returns Better Auth's redirect (session cookie on success)
   * @throws {DomainError} `PROVIDER_NOT_CONFIGURED`
   */
  async callback(request: Request): Promise<Response> {
    assertEnabled()
    return mapCallbackRedirect(await auth.handler(request))
  },

  /**
   * Links Google to the signed-in account (caller checks the session).
   *
   * @param request - Incoming request carrying the session cookie
   * @returns `302` to Google, or to the destination when already linked
   * @throws {DomainError} `PROVIDER_NOT_CONFIGURED`
   */
  async link(request: Request): Promise<Response> {
    assertEnabled()
    const target = destination(
      new URL(request.url).searchParams.get('callbackURL')
    )
    const response = await auth.api.linkSocialAccount({
      body: {
        provider: PROVIDER,
        callbackURL: target,
        errorCallbackURL: target,
      },
      headers: request.headers,
      asResponse: true,
    })
    return toRedirect(response, target)
  },
}
