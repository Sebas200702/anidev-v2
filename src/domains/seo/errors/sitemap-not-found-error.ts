/**
 * Not-found error for sitemap files.
 *
 * @module domains/seo/errors/sitemap-not-found-error
 */
import { DomainError } from '@shared/errors/app-error'
import { ErrorCodes } from '@shared/errors/codes'

/**
 * Creates the error for an unknown segment or an out-of-range page.
 *
 * @param file - Requested file name without extension (e.g. `anime-9`)
 * @returns A {@link DomainError} with code `SITEMAP_NOT_FOUND` (HTTP 404)
 */
export const sitemapNotFound = (file: string) =>
  new DomainError(ErrorCodes.SITEMAP_NOT_FOUND, 'Sitemap not found', { file })
