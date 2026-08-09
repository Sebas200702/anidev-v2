/**
 * Application service for paginated music list data.
 *
 * @module domains/music/services/music-list/service
 */
import { withCache } from '@lib/cache'
import { musicListCache } from '@music/cache/music-list'
import { mapMusicListToCards } from '@music/mappers/music-card'
import { mapMusicListFilters } from '@music/mappers/music-filters'
import { musicListRepository } from '@music/repositories/music-list'
import { musicRelationRepository } from '@music/repositories/music-relation'
import type {
  MusicArtistDB,
  MusicCard,
  MusicListFilters,
  MusicListFiltersParams,
} from '@music/types'

/**
 * Groups artist rows by parent music ID for card mapping.
 *
 * @internal
 */
const groupArtistsByMusicId = (
  artists: Array<MusicArtistDB & { musicId: number }>
): Record<number, MusicArtistDB[]> => {
  return artists.reduce<Record<number, MusicArtistDB[]>>((acc, row) => {
    const { musicId, ...artist } = row
    if (!acc[musicId]) {
      acc[musicId] = []
    }
    acc[musicId].push(artist)
    return acc
  }, {})
}

/**
 * Coordinates repository access, mapping, and caching for music list pages.
 *
 * @remarks
 * **Pipeline:** `mapMusicListFilters(params)` → `music:list:{JSON}` → list + count
 * repos → batch artists → `mapMusicListToCards` → `{ list, total }`
 *
 * **Cache TTL:** {@link CacheTtl.Medium} (3600 s)
 *
 * @see {@link musicListCache}
 */
export const musicListService = {
  /**
   * Loads a filtered, paginated music list with total count.
   *
   * @param filtersParams - Raw query parameters (coerced by Zod at the route)
   * @returns `{ list: MusicCard[], total: number }` for the current filter page
   *
   * @throws {InfraError} On repository or cache failures
   *
   * @example
   * ```typescript
   * const { list, total } = await musicListService.getMusicList({
   *   page: 1, limit: 10, type: 'OP',
   * })
   * ```
   */
  async getMusicList(
    filtersParams: MusicListFiltersParams
  ): Promise<{ list: MusicCard[]; total: number }> {
    const filters: MusicListFilters = mapMusicListFilters(filtersParams)

    return withCache({
      key: musicListCache.key(filters),
      getCache: () => musicListCache.get(filters),
      setCache: (_, value) => musicListCache.set(filters, value),
      compute: async () => {
        const [musicList, total] = await Promise.all([
          musicListRepository.getMusicList(filters),
          musicListRepository.getMusicListCount(filters),
        ])

        if (musicList.length === 0) {
          return { list: [], total }
        }

        const musicIds = musicList.map((m) => m.id)
        const artists =
          await musicRelationRepository.findArtistsByMusicIds(musicIds)

        const list = mapMusicListToCards({
          musicList,
          artistsByMusicId: groupArtistsByMusicId(artists),
        })

        return { list, total }
      },
    })
  },
}
