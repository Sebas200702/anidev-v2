/**
 * Application service for the extended printed-media payload.
 *
 * @module domains/manga/services/manga-full/service
 */
import type { StaleResult } from '@lib/cache/cache-store-types'
import { mangaDetailCacheKeys } from '@manga/cache/manga-detail'
import { mapMangaToFullDetails } from '@manga/mappers/manga-full'
import {
  loadMangaDetailRows,
  withMangaDetailCache,
} from '@manga/services/manga-detail-rows'
import type { MangaFullDetails } from '@manga/types'

/** Coordinates loading, mapping and caching of `/api/manga/:malId/full`. */
export const mangaFullService = {
  /**
   * Loads a printed work with nested taxonomy, every title and grouped
   * relations.
   *
   * @param mangaId - MyAnimeList id of the work
   * @returns `{ value, isStale }` — the extended DTO plus a stale flag
   * @throws {DomainError} `MANGA_NOT_FOUND` when the work does not exist
   * @throws {InfraError} On repository or cache failures
   */
  getMangaFullByMalId(mangaId: number): Promise<StaleResult<MangaFullDetails>> {
    return withMangaDetailCache(mangaDetailCacheKeys.full(mangaId), async () =>
      mapMangaToFullDetails(await loadMangaDetailRows(mangaId))
    )
  },
}
