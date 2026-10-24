/**
 * Cache keys of the printed-media detail payloads.
 *
 * @module domains/manga/cache/manga-detail/keys
 */

/**
 * Keys of the detail (`/api/manga/:malId`) and extended (`/full`) payloads.
 *
 * @remarks
 * The stale copy of each lives under the same key with a `:stale` suffix.
 */
export const mangaDetailCacheKeys = {
  detail: (mangaId: number) => `manga:detail:${mangaId}`,
  full: (mangaId: number) => `manga:full:${mangaId}`,
}
