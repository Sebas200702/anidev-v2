/**
 * Pagination metadata of list responses.
 *
 * @module shared/http/page-meta-util
 */

/**
 * Builds the `meta` of a paginated list response.
 *
 * @param pagination - Requested `page` (1-based) and `limit`
 * @param total - Total matching items
 * @param isStale - Whether the list came from the stale cache snapshot
 * @returns `{ stale, page, total, hasNext }`
 *
 * @example
 * ```ts
 * buildPageMeta({ page: 2, limit: 20 }, 45, false)
 * // { stale: false, page: 2, total: 45, hasNext: true }
 * ```
 */
export const buildPageMeta = (
  { page, limit }: { page: number; limit: number },
  total: number,
  isStale: boolean
) => ({ stale: isStale, page, total, hasNext: page * limit < total })
