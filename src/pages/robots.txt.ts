/**
 * Crawler directives endpoint.
 *
 * @module pages/robots.txt
 *
 * **Route:** `GET /robots.txt` — public, static per deployment.
 */
import type { APIRoute } from 'astro'
import { config } from '@/config'
import { buildRobotsTxt } from '@seo/utils/robots-txt'
import { seoResponse } from '@seo/utils/seo-response'

/** Returns `robots.txt` pointing to the sitemap index on `APP_BASE_URL`. */
export const GET: APIRoute = () =>
  seoResponse(buildRobotsTxt(config.baseUrl), 'text/plain')
