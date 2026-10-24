/**
 * Pure builders for sitemaps.org XML documents.
 *
 * @module domains/seo/utils/sitemap-xml/util
 * @remarks
 * No I/O: callers pass the base URL and the site-relative paths. Paths are
 * URI-encoded (spaces, non-ASCII) and then XML-escaped, as the protocol
 * requires.
 * @see https://www.sitemaps.org/protocol.html
 */
import type { SitemapUrl } from './types'

const XML_HEADER = '<?xml version="1.0" encoding="UTF-8"?>'
const SITEMAP_NS = 'http://www.sitemaps.org/schemas/sitemap/0.9'

const XML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;',
}

const escapeXml = (value: string) =>
  value.replaceAll(/[&<>"']/g, (char) => XML_ENTITIES[char])

/** Joins base URL and path into an encoded, escaped absolute `<loc>` value. */
const toLoc = (baseUrl: string, path: string) =>
  escapeXml(encodeURI(`${baseUrl.replace(/\/$/, '')}${path}`))

/**
 * Builds a `<urlset>` document.
 *
 * @param baseUrl - Absolute site origin (e.g. `APP_BASE_URL`)
 * @param urls - Site-relative paths, each starting with `/`
 * @returns The XML document
 *
 * @example
 * ```ts
 * buildUrlSetXml('https://anidev.app', [{ path: '/anime/1/cowboy-bebop' }])
 * ```
 */
export const buildUrlSetXml = (baseUrl: string, urls: SitemapUrl[]): string => {
  const entries = urls
    .map(({ path }) => `<url><loc>${toLoc(baseUrl, path)}</loc></url>`)
    .join('')
  return `${XML_HEADER}<urlset xmlns="${SITEMAP_NS}">${entries}</urlset>`
}

/**
 * Builds a `<sitemapindex>` document pointing to `/sitemaps/<file>.xml`.
 *
 * @param baseUrl - Absolute site origin
 * @param files - File names without extension (e.g. `anime-1`)
 * @returns The XML document
 */
export const buildSitemapIndexXml = (
  baseUrl: string,
  files: string[]
): string => {
  const entries = files
    .map(
      (file) =>
        `<sitemap><loc>${toLoc(baseUrl, `/sitemaps/${file}.xml`)}</loc></sitemap>`
    )
    .join('')
  return `${XML_HEADER}<sitemapindex xmlns="${SITEMAP_NS}">${entries}</sitemapindex>`
}
