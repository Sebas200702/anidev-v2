import { withCache } from '@/core/cache'
import { animeDetailsCache } from '@/domains/anime/cache/anime-cache'
import { animeNotFound } from '@/domains/anime/errors'
import { mapAnimeDetails } from '@/domains/anime/mappers/anime'
import { animeRepository } from '@/domains/anime/repositories/anime'
import { animeTaxonomyRepository } from '@/domains/anime/repositories/anime-taxonomy'
import { animeMediaRepository } from '@/domains/media/repositories/anime-media'

export const animeService = {
  async getAnimeDetails(malId: number) {
    return withCache({
      key: animeDetailsCache.key(malId),
      getCache: () => animeDetailsCache.get(malId),
      setCache: (_, value) => animeDetailsCache.set(malId, value),
      compute: async () => {
        const anime = await animeRepository.getAnimeByMalId(malId)
        if (!anime) {
          throw animeNotFound(malId)
        }

        const [media, genres, themes, demographics] = await Promise.all([
          animeMediaRepository.getMediaByAnimeId(malId),
          animeTaxonomyRepository.getGenresByAnimeId(malId),
          animeTaxonomyRepository.getThemesByAnimeId(malId),
          animeTaxonomyRepository.getDemographicsByAnimeId(malId),
        ])

        return mapAnimeDetails({
          anime,
          media,
          genres,
          themes,
          demographics,
        })
      },
    })
  },
}
