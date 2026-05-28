/**
 * @module config
 *
 * Central application configuration barrel that exposes validated environment
 * variables, site-wide metadata, and public-route allowlists. This module sits
 * at the top of the configuration layer and is consumed by pages, middleware,
 * and SEO helpers that need canonical URLs or branding constants.
 *
 * @remarks
 * `config.baseUrl` is derived from `APP_BASE_URL` when set, otherwise falls
 * back to `BETTER_AUTH_URL`, with trailing slashes stripped. Import from this
 * barrel when you need multiple config concerns; import `./env` or
 * `./public-routes` directly when tree-shaking or avoiding circular imports.
 *
 * @see {@link module:config/env} for runtime environment validation
 * @see {@link module:config/public-routes} for unauthenticated route allowlist
 * @see {@link module:middleware/auth-middleware} for session gating that uses public routes
 */
import { env } from './env'

const baseUrl = (env.APP_BASE_URL ?? env.BETTER_AUTH_URL).replace(/\/$/, '')

/**
 * Site metadata and derived URLs used across pages, Open Graph tags, and SEO.
 *
 * @property baseUrl - Canonical origin without trailing slash (e.g. `https://anidev.example`).
 * @property baseTitle - Default HTML `<title>` prefix and brand name.
 * @property baseImage - Absolute URL to the default Open Graph / social preview image.
 * @property baseDescription - Default meta description for pages without explicit copy.
 *
 * @remarks
 * All URL fields are computed at module load from validated env values; they
 * are stable for the process lifetime and safe to use in SSR and static builds.
 *
 * @see {@link env} for the underlying URL environment variables
 */
export const config = {
  baseUrl,
  baseTitle: 'AniDev',
  baseImage: `${baseUrl}/og-image.png`,
  baseDescription:
    'Discover, track, and share your anime journey with AniDev. Explore a vast library of anime titles, create personalized watchlists, and connect with fellow anime enthusiasts. Start your anime adventure today!',
}

export { env } from './env'
export * from './public-routes'
