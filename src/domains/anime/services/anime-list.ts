import { withCache } from '@/core/cache'
import { animeListCache } from '@/domains/anime/cache/anime-list'
import { mapAnimeListToCards } from '@/domains/anime/mappers/anime-card'
import { mapAnimeFilters } from '@/domains/anime/mappers/anime-filters'
import { animeListRepository } from '@/domains/anime/repositories/anime-list'
import type {
  AnimeFilters,
  AnimeFiltersParams,
} from '@/domains/anime/types/anime-list'
export const animeListService = {
  async getAnimeList(filtersParams: AnimeFiltersParams) {
    return withCache({
      key: animeListCache.key(mapAnimeFilters(filtersParams)),
      getCache: () => animeListCache.get(mapAnimeFilters(filtersParams)),
      setCache: (_, value) =>
        animeListCache.set(mapAnimeFilters(filtersParams), value),
      compute: async () => {
        const filters: AnimeFilters = mapAnimeFilters(filtersParams)
        const animeList = await animeListRepository.getAnimeList(filters)
        const total = await animeListRepository.getAnimeListCount(filters)

        return {
          list: mapAnimeListToCards({
            animeList,
          }),
          total,
        }
      },
    })
  },
}
