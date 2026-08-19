/**
 * Application service for the featured-anime carousel.
 *
 * @module domains/anime/services/anime-carousel/service
 */
import { animeCarouselCache } from '@anime/cache/anime-carousel'
import { CAROUSEL_SLIDE_LIMIT } from '@anime/constants'
import { mapCarouselItem } from '@anime/mappers/anime-carousel'
import { animeCarouselRepository } from '@anime/repositories/anime-carousel'
import { animeTaxonomyRepository } from '@anime/repositories/anime-taxonomy'
import type { CarouselItem } from '@anime/types'
import { withCache } from '@lib/cache'
import { getAnimeMedia } from '@media/services/get-anime-media'

/**
 * Builds the home-page carousel slides.
 *
 * @remarks
 * **Pipeline:** `anime:list:carousel` → eligible anime (banner + clear logo)
 * → parallel media/genre fetch per anime → {@link mapCarouselItem}
 *
 * **Cache TTL:** {@link CacheTtl.Medium} (3600 s)
 *
 * @see {@link animeCarouselCache}
 * @see {@link animeCarouselRepository}
 */
export const animeCarouselService = {
  /**
   * Loads the featured slides, cached as one payload.
   *
   * @returns Up to {@link CAROUSEL_SLIDE_LIMIT} slides, most popular first, or
   * an empty array when no anime has the required artwork
   *
   * @throws {InfraError} On repository or cache failures
   *
   * @example
   * ```typescript
   * const items = await animeCarouselService.getCarouselItems()
   * ```
   */
  async getCarouselItems(): Promise<CarouselItem[]> {
    return withCache({
      key: animeCarouselCache.key(),
      getCache: () => animeCarouselCache.get(),
      setCache: (_, value) => animeCarouselCache.set(value),
      compute: async () => {
        const animeList =
          await animeCarouselRepository.getTopPopularWithMedia(
            CAROUSEL_SLIDE_LIMIT
          )
        if (animeList.length === 0) return []

        const malIds = animeList.map((anime) => anime.malId)
        const [mediaResults, genreResults] = await Promise.all([
          Promise.all(malIds.map((id) => getAnimeMedia(id))),
          Promise.all(
            malIds.map((id) => animeTaxonomyRepository.getGenresByAnimeId(id))
          ),
        ])

        return animeList.map((anime, index) =>
          mapCarouselItem({
            anime,
            media: mediaResults[index],
            genres: genreResults[index],
          })
        )
      },
    })
  },
}
