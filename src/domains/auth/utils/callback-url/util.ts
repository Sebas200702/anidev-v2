/**
 * Open-redirect guard for post-sign-in destinations.
 *
 * @module domains/auth/utils/callback-url/util
 */

/** Destination when the requested one is not a safe same-site path. */
const FALLBACK_PATH = '/'

/**
 * Returns `raw` only when it is a same-site relative path, else `/`.
 *
 * @remarks
 * Accepts values that start with a single `/` (not `//` or `/\`, which
 * browsers treat as protocol-relative) and that still resolve to the app's
 * origin. Absolute URLs are rejected even when they point to the app, so the
 * result is always a path.
 *
 * @param raw - Untrusted `callbackURL` query value
 * @param baseUrl - App origin (`APP_BASE_URL`)
 * @returns A safe path such as `/profile?tab=lists`
 *
 * @example
 * ```ts
 * sanitizeCallbackURL('//evil.example', 'https://anidev.app') // '/'
 * ```
 */
export const sanitizeCallbackURL = (
  raw: string | null | undefined,
  baseUrl: string
): string => {
  if (!raw?.startsWith('/') || /^\/[/\\]/.test(raw)) return FALLBACK_PATH
  try {
    const origin = new URL(baseUrl).origin
    const resolved = new URL(raw, origin)
    if (resolved.origin !== origin) return FALLBACK_PATH
    return `${resolved.pathname}${resolved.search}${resolved.hash}`
  } catch {
    return FALLBACK_PATH
  }
}
