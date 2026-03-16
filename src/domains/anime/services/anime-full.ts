import { animeTitleRepository } from '@/domains/anime/repositories/anime-title'
import { animeRelationsRepository } from '@/domains/anime/repositories/anime-relations'
import { animeExternalRepository } from '@/domains/anime/repositories/anime-external'
import { animeMusicRepository } from '@/domains/music/repositories/anime-music'
import { mapAnimeToFullDetails } from '@/domains/anime/mappers/anime-full'
import { animeFullCache } from '@/domains/anime/cache/anime-full-cache'
import { withCache } from '@/core/cache'
import { animeRepository } from '@/domains/anime/repositories/anime'
import { animeMediaRepository } from '@/domains/anime/repositories/anime-media'
import { animeTaxonomyRepository } from '@/domains/anime/repositories/anime-taxonomy'
import { animeNotFound } from '@/domains/anime/errors'

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
