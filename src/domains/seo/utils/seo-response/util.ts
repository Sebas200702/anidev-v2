/**
 * Plain (non-JSON) responses for the SEO endpoints.
 *
 * @module domains/seo/utils/seo-response/util
 * @remarks
 * Crawlers expect XML / text, not the JSON envelope, so these endpoints build
 * their own responses. Errors still go through {@link mapErrorToHttp} so they
 * are captured and keep the status and headers (`Retry-After` on 503).
 */
import { mapErrorToHttp } from '@shared/errors/map-error-to-http'
import { SEO_CACHE_CONTROL } from '@seo/constants'

/**
 * Builds a cacheable success response.
 *
 * @param body - Document body
 * @param contentType - `application/xml` or `text/plain`
 * @returns `200` response with charset and `Cache-Control`
 */
export const seoResponse = (body: string, contentType: string): Response =>
  new Response(body, {
    status: 200,
    headers: {
      'Content-Type': `${contentType}; charset=utf-8`,
      'Cache-Control': SEO_CACHE_CONTROL,
    },
  })

/**
 * Maps an error to a plain-text response with the mapped status and headers.
 *
 * @param error - Any thrown value
 * @returns Non-cacheable plain-text error response
 */
export const seoErrorResponse = (error: unknown): Response => {
  const { status, body, headers } = mapErrorToHttp(error)
  return new Response(body.message, {
    status,
    headers: {
      ...headers,
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}
