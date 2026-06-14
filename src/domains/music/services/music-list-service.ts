/**
 * Application service for paginated music list data.
 *
 * @module domains/music/services/music-list-service
 */
import { withCache } from '@lib/cache'
import { musicListCache } from '@domains/music/cache/music-list-cache'
import { mapMusicCardFromMetadata } from '@domains/music/mappers/music-card-mapper'
import { mapMusicListFilters } from '@domains/music/mappers/music-filters-mapper'
import { musicListRepository } from '@domains/music/repositories/music-list-repository'
import { musicMetadataLoader } from '@domains/music/services/music-metadata-loader'
import type { MusicCard, MusicListFilters, MusicListFiltersParams } from '@domains/music/types'

export const musicListService = {
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

        const musicIds = musicList.map((music) => music.id)
        const metadataById = await musicMetadataLoader.getByIds(musicIds)

        const list = musicList.flatMap((music) => {
          const metadata = metadataById.get(music.id)
          return metadata ? [mapMusicCardFromMetadata(metadata)] : []
        })

        return { list, total }
      },
    })
  },
}
