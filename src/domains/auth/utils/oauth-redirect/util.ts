/**
 * Redirect plumbing for the Google sign-in routes.
 *
 * @module domains/auth/utils/oauth-redirect/util
 * @remarks
 * Better Auth's social endpoints answer JSON (`{ url, redirect }`) plus the
 * OAuth state cookie; browsers following a link need a `302` instead. These
 * helpers turn those responses into redirects without dropping cookies, and
 * rewrite Better Auth's callback error codes into ours.
 */
import { ErrorCodes } from '@shared/errors/codes'
import { DomainError } from '@shared/errors/app-error'
import { createErrorResponse } from '@shared/http/create-api-response-util'
import { jsonResponse } from '@shared/http/api-response-serialize-util'

/** Better Auth's error code when a same-email account exists unlinked. */
const BETTER_AUTH_NOT_LINKED = 'account_not_linked'

/** Copies every `Set-Cookie` of `from` onto `headers`. */
const forwardCookies = (from: Response, headers: Headers) => {
  for (const cookie of from.headers.getSetCookie()) {
    headers.append('Set-Cookie', cookie)
  }
}

/**
 * Converts a Better Auth `{ url }` JSON response into a `302`.
 *
 * @param response - `auth.api.*({ asResponse: true })` result
 * @param fallback - Destination when `url` is empty (already linked)
 * @returns A redirect carrying the original cookies
 */
export const toRedirect = async (
  response: Response,
  fallback: string
): Promise<Response> => {
  const { url } = (await response.json()) as { url?: string }
  const headers = new Headers({ Location: url || fallback })
  forwardCookies(response, headers)
  return new Response(null, { status: 302, headers })
}

/**
 * Rewrites the callback redirect's `error=account_not_linked` into
 * `error=ACCOUNT_EXISTS_USE_PASSWORD`; any other response passes through.
 *
 * @param response - `auth.handler` result for the OAuth callback
 * @returns The same response, or a copy with the rewritten `Location`
 */
export const mapCallbackRedirect = (response: Response): Response => {
  const location = response.headers.get('Location')
  if (!location?.includes(`error=${BETTER_AUTH_NOT_LINKED}`)) return response

  const headers = new Headers(response.headers)
  headers.set(
    'Location',
    location.replace(
      `error=${BETTER_AUTH_NOT_LINKED}`,
      `error=${ErrorCodes.ACCOUNT_EXISTS_USE_PASSWORD}`
    )
  )
  return new Response(null, { status: response.status, headers })
}

/** Error for a sign-in route whose provider has no credentials configured. */
export const providerNotConfigured = (provider: string) =>
  new DomainError(
    ErrorCodes.PROVIDER_NOT_CONFIGURED,
    'Sign-in provider is not configured',
    { provider }
  )

/**
 * Runs a redirect-producing handler; thrown errors become the JSON error
 * envelope (with mapped status and headers) like every other API route.
 *
 * @param handler - Builds the redirect `Response`
 * @returns The handler's response or the error envelope
 */
export const withOAuthErrors = async (
  handler: () => Promise<Response>
): Promise<Response> => {
  try {
    return await handler()
  } catch (error) {
    const { payload, headers } = createErrorResponse(error)
    return jsonResponse(payload, headers)
  }
}
