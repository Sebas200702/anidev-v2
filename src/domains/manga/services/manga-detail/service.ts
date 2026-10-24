/**
 * Application service for the printed-media detail payload.
 *
 * @module domains/manga/services/manga-detail/service
 */
import type { StaleResult } from '@lib/cache/cache-store-types'
import { mangaDetailCacheKeys } from '@manga/cache/manga-detail'
import { mapMangaDetails } from '@manga/mappers/manga-mapper'
import {
  loadMangaDetailRows,
  withMangaDetailCache,
} from '@manga/services/manga-detail-rows'
import type { MangaDetails } from '@manga/types'

/** Coordinates loading, mapping and caching of the printed-media detail. */
export const mangaDetailsService = {
  /**
   * Loads a printed work with its taxonomy, cast (with voices), staff and links.
   *
   * @param mangaId - MyAnimeList id of the work
   * @returns `{ value, isStale }` — the detail DTO plus a stale flag
   * @throws {DomainError} `MANGA_NOT_FOUND` when the work does not exist
   * @throws {InfraError} On repository or cache failures
   */
  getMangaDetails(mangaId: number): Promise<StaleResult<MangaDetails>> {
    return withMangaDetailCache(
      mangaDetailCacheKeys.detail(mangaId),
      async () => mapMangaDetails(await loadMangaDetailRows(mangaId))
    )
  },
}
