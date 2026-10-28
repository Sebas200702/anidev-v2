/**
 * Builder of the `robots.txt` body.
 *
 * @module domains/seo/utils/robots-txt/util
 */
import { ROBOTS_DISALLOWED_PATHS } from '@seo/constants'

/**
 * Builds `robots.txt`: allow everything except API and showcase paths, and
 * point to the sitemap index.
 *
 * @param baseUrl - Absolute site origin (e.g. `APP_BASE_URL`)
 * @returns The plain-text body
 */
export const buildRobotsTxt = (baseUrl: string): string =>
  [
    'User-agent: *',
    'Allow: /',
    ...ROBOTS_DISALLOWED_PATHS.map((path) => `Disallow: ${path}`),
    '',
    `Sitemap: ${baseUrl.replace(/\/$/, '')}/sitemap.xml`,
    '',
  ].join('\n')
