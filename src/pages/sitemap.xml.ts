/**
 * Sitemap index endpoint.
 *
 * @module pages/sitemap.xml
 *
 * **Route:** `GET /sitemap.xml` — public, cached for a day server-side.
 *
 * Lists one `/sitemaps/<segment>-<n>.xml` entry per page of every registered
 * segment.
 *
 * @see {@link sitemapService.getIndex}
 */
import type { APIRoute } from 'astro'
import { sitemapService } from '@seo/services/sitemap'
import { seoErrorResponse, seoResponse } from '@seo/utils/seo-response'

/** Returns the sitemap index XML (`503` + `Retry-After` when uncached and the DB is down). */
export const GET: APIRoute = async () => {
  try {
    const { value } = await sitemapService.getIndex()
    return seoResponse(value, 'application/xml')
  } catch (error) {
    return seoErrorResponse(error)
  }
}
