/**
 * Domain constants for SEO (sitemaps and crawler directives).
 *
 * @module domains/seo/constants
 */

/** Maximum URLs per sitemap page (the protocol allows 50,000). */
export const SITEMAP_PAGE_SIZE = 10_000

/** Cache key prefix of the rendered sitemap documents. */
export const SITEMAP_CACHE_PREFIX = 'seo:sitemap'

/** Paths crawlers must skip (`Disallow:` lines of `robots.txt`). */
export const ROBOTS_DISALLOWED_PATHS = ['/api/', '/showcase'] as const

/** `Cache-Control` of the sitemap and robots responses. */
export const SEO_CACHE_CONTROL = 'public, max-age=3600'
