/**
 * Renders and caches the sitemap index and its pages.
 *
 * @module domains/seo/services/sitemap/service
 */
import { config } from '@/config'
import { cacheGet, cacheSet, withStaleCache } from '@lib/cache'
import { CacheTtl } from '@lib/cache/config'
import type { StaleResult } from '@lib/cache/cache-store-types'
import { SITEMAP_SEGMENTS } from '@seo/config'
import { SITEMAP_CACHE_PREFIX } from '@seo/constants'
import { sitemapNotFound } from '@seo/errors'
import { buildSitemapIndexXml, buildUrlSetXml } from '@seo/utils/sitemap-xml'

/** Serves an XML document through the stale-while-error cache for a day. */
const cachedXml = (
  key: string,
  compute: () => Promise<string>
): Promise<StaleResult<string>> =>
  withStaleCache({
    key,
    staleKey: `${key}:stale`,
    getCache: () => cacheGet<string>(key),
    getStaleCache: (staleKey) => cacheGet<string>(staleKey),
    setCache: (_, value) => cacheSet(key, value, { ttlSeconds: CacheTtl.Long }),
    setStaleCache: (staleKey, value) =>
      cacheSet(staleKey, value, { ttlSeconds: CacheTtl.Stale }),
    compute,
  })

/** Sitemap use cases. */
export const sitemapService = {
  /**
   * Renders the sitemap index: one entry per page of every segment.
   *
   * @returns `{ value, isStale }` with the XML document
   * @throws {InfraError} On database failure with no cached copy
   */
  getIndex(): Promise<StaleResult<string>> {
    return cachedXml(`${SITEMAP_CACHE_PREFIX}:index`, async () => {
      const pageCounts = await Promise.all(
        SITEMAP_SEGMENTS.map((segment) => segment.countPages())
      )
      const files = SITEMAP_SEGMENTS.flatMap(({ name }, index) =>
        Array.from({ length: pageCounts[index] }, (_, i) => `${name}-${i + 1}`)
      )
      return buildSitemapIndexXml(config.baseUrl, files)
    })
  },

  /**
   * Renders page `page` of a segment.
   *
   * @param segmentName - Registered segment name
   * @param page - 1-based page number
   * @returns `{ value, isStale }` with the XML document
   * @throws {DomainError} `SITEMAP_NOT_FOUND` for an unknown segment or page
   * @throws {InfraError} On database failure with no cached copy
   */
  async getPage(
    segmentName: string,
    page: number
  ): Promise<StaleResult<string>> {
    const file = `${segmentName}-${page}`
    const segment = SITEMAP_SEGMENTS.find(({ name }) => name === segmentName)
    if (!segment || page < 1) throw sitemapNotFound(file)

    return cachedXml(`${SITEMAP_CACHE_PREFIX}:${file}`, async () => {
      if (page > (await segment.countPages())) throw sitemapNotFound(file)
      return buildUrlSetXml(config.baseUrl, await segment.getPage(page))
    })
  },
}
