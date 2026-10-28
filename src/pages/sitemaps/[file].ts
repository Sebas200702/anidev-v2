/**
 * Sitemap page endpoint.
 *
 * @module pages/sitemaps/[file]
 *
 * **Route:** `GET /sitemaps/<segment>-<n>.xml` — public.
 *
 * Any other file name, an unknown segment or an out-of-range page is `404`.
 *
 * @see {@link sitemapService.getPage}
 */
import type { APIRoute } from 'astro'
import { sitemapNotFound } from '@seo/errors'
import { sitemapService } from '@seo/services/sitemap'
import { seoErrorResponse, seoResponse } from '@seo/utils/seo-response'

const SITEMAP_FILE_PATTERN = /^([a-z]+)-(\d{1,6})\.xml$/

/** Returns one sitemap URL set. */
export const GET: APIRoute = async ({ params }) => {
  const file = params.file ?? ''
  try {
    const match = SITEMAP_FILE_PATTERN.exec(file)
    if (!match) throw sitemapNotFound(file)

    const [, segment, page] = match
    const { value } = await sitemapService.getPage(segment, Number(page))
    return seoResponse(value, 'application/xml')
  } catch (error) {
    return seoErrorResponse(error)
  }
}
