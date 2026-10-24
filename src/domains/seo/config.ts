/**
 * Sitemap segment registry.
 *
 * @module domains/seo/config
 * @remarks
 * One entry per family of public pages. Adding a page family (manga,
 * producers) is one entry here; the index, the paging and the routes pick it
 * up. Only list pages that render: a sitemap URL that 404s hurts crawling.
 */
import { normalizeString } from '@utils/string/normalize-string-util'
import { sitemapRepository } from '@seo/repositories/sitemap'
import { SITEMAP_PAGE_SIZE } from '@seo/constants'
import type { SitemapUrl } from '@seo/utils/sitemap-xml'

/** A family of pages listed in the sitemap. */
export interface SitemapSegment {
  /** File prefix: pages are served as `/sitemaps/<name>-<n>.xml`. */
  name: string
  /** Number of pages (at least 1). */
  countPages: () => Promise<number>
  /** URLs of page `n` (1-based). */
  getPage: (page: number) => Promise<SitemapUrl[]>
}

const STATIC_PATHS = ['/', '/search']

const toAnimePath = ({ malId, title }: { malId: number; title: string }) =>
  `/anime/${malId}/${encodeURIComponent(
    normalizeString({ string: title, separator: '-', toLowerCase: true })
  )}`

/** Registered segments, in index order. */
export const SITEMAP_SEGMENTS: SitemapSegment[] = [
  {
    name: 'static',
    countPages: () => Promise.resolve(1),
    getPage: () => Promise.resolve(STATIC_PATHS.map((path) => ({ path }))),
  },
  {
    name: 'anime',
    countPages: async () =>
      Math.max(
        1,
        Math.ceil((await sitemapRepository.countAnime()) / SITEMAP_PAGE_SIZE)
      ),
    getPage: async (page) =>
      (
        await sitemapRepository.getAnimePage(
          (page - 1) * SITEMAP_PAGE_SIZE,
          SITEMAP_PAGE_SIZE
        )
      ).map((row) => ({ path: toAnimePath(row) })),
  },
  {
    name: 'genres',
    countPages: () => Promise.resolve(1),
    getPage: async () =>
      (await sitemapRepository.getGenreNames()).map((name) => ({
        path: `/search?genre=${encodeURIComponent(name)}`,
      })),
  },
]
