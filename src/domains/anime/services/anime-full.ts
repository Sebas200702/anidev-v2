import { withCache } from '@/core/cache'
import { animeFullCache } from '@/domains/anime/cache/anime-full-cache'
import { animeNotFound } from '@/domains/anime/errors'
import { mapAnimeToFullDetails } from '@/domains/anime/mappers/anime-full'
import { animeRepository } from '@/domains/anime/repositories/anime'
import { animeExternalRepository } from '@/domains/anime/repositories/anime-external'
import { animeRelationsRepository } from '@/domains/anime/repositories/anime-relations'
import { animeTaxonomyRepository } from '@/domains/anime/repositories/anime-taxonomy'
import { animeTitleRepository } from '@/domains/anime/repositories/anime-title'
import { animeMediaRepository } from '@/domains/media/repositories/anime-media'
import { animeMusicRepository } from '@/domains/music/repositories/anime-music'

export const animeFullService = {
  async getAnimeFullByMalId(malId: number) {
    return withCache({
      key: animeFullCache.key(malId),
      getCache: () => animeFullCache.get(malId),
      setCache: (_, value) => animeFullCache.set(malId, value),
      compute: async () => {
        const anime = await animeRepository.getAnimeByMalId(malId)
        if (!anime) {
          throw animeNotFound(malId)
        }

        const [
          media,
          genres,
          themes,
          demographics,
          titleSynonyms,
          relations,
          relationData,
          externalIds,
          animeMusic,
        ] = await Promise.all([
          animeMediaRepository.getMediaByAnimeId(malId),
          animeTaxonomyRepository.getGenresByAnimeId(malId),
          animeTaxonomyRepository.getThemesByAnimeId(malId),
          animeTaxonomyRepository.getDemographicsByAnimeId(malId),
          animeTitleRepository.getTitleSynonymsByAnimeId(malId),
          animeRelationsRepository.getRelatedAnimeByAnimeId(malId),
          animeRelationsRepository.getAnimeRelatedAnimeDataByAnimeId(malId),
          animeExternalRepository.getExternalLinksByAnimeId(malId),
          animeMusicRepository.findMusicByAnimeId(malId),
        ])

        return mapAnimeToFullDetails({
          anime,
          genres,
          themes,
          demographics,
          media,
          titleSynonyms,
          relations,
          relationData,
          externalIds,
          animeMusic,
        })
      },
    })
  },
}
