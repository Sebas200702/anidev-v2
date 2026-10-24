/**
 * Types of the sitemap XML builders.
 *
 * @module domains/seo/utils/sitemap-xml/types
 */

/** One sitemap entry: a site-relative path starting with `/`. */
export interface SitemapUrl {
  path: string
}
