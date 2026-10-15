/**
 * Session cookie helpers for auth middleware.
 *
 * @module middleware/session-cookies/service
 */

/** Cookie substrings that indicate a Better Auth session may be present. */
export const authCookieMarkers = ['session_token=', 'session_data=']

/**
 * Clears authenticated actor state on request locals.
 */
export const clearSession = (locals: App.Locals) => {
  locals.user = null
  locals.session = null
}

/**
 * Detects whether the raw `Cookie` header contains Better Auth session markers.
 */
export const hasAuthCookie = (cookieHeader: string | null) => {
  if (!cookieHeader) return false
  return authCookieMarkers.some((marker) => cookieHeader.includes(marker))
}
