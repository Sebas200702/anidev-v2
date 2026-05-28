/**
 * @module config/public-routes
 *
 * Defines the allowlist of URL pathnames that may be accessed without an
 * authenticated session. Used by auth middleware to decide whether to clear
 * invalid session state or block access, and by route guards that mirror the
 * same policy on the client.
 *
 * @remarks
 * Matching is prefix-based: a pathname is public if it equals a listed route
 * or starts with `{route}/`. Trailing slashes on the incoming pathname are
 * not normalized; callers should pass `context.url.pathname` as-is. API list
 * endpoints under `/api/anime` and `/api/music` are intentionally public for
 * browse-before-login flows.
 *
 * @see {@link module:middleware/auth-middleware} for runtime enforcement
 * @see {@link isPublicRoute} for the matching helper
 */
/**
 * Paths accessible without a valid session.
 *
 * @remarks
 * Declared `as const` for literal type inference. Add new entries here when
 * introducing marketing pages, public APIs, or static asset routes that must
 * not redirect unauthenticated users.
 *
 * @readonly
 */
export const publicRoutes = [
  '/',
  '/api/auth/login',
  '/api/auth/register',
  '/api/anime',
  '/api/music',
  '/media',
] as const

/**
 * Checks whether a pathname is public or nested under a public route prefix.
 *
 * @param pathname - Request pathname to evaluate (e.g. `/api/anime/123`).
 * Must be the path component only, without query string or hash. Empty string
 * is not public unless explicitly listed. Invalid or malformed paths are
 * treated as non-matching except when they equal or extend a listed route.
 * @returns `true` when the route does not require authentication; `false`
 * when access should be gated behind a valid session. Never returns `null`.
 *
 * @throws Does not throw; always returns a boolean regardless of input shape.
 *
 * @example
 * ```typescript
 * import { isPublicRoute } from '@config/public-routes'
 *
 * isPublicRoute('/') // true
 * isPublicRoute('/api/anime/search') // true (prefix of /api/anime)
 * isPublicRoute('/dashboard') // false
 * isPublicRoute('/media/posters/abc.webp') // true (prefix of /media)
 * ```
 *
 * @see {@link publicRoutes} for the authoritative allowlist
 * @see {@link module:middleware/auth-middleware} for middleware integration
 */
export function isPublicRoute(pathname: string) {
  return publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  )
}
