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
import type { GenreDB } from '@anime/types'
import type { MediaAsset } from '@media/types'
import { withCache } from '@lib/cache'
import { getAnimeMediaByIds } from '@media/services/get-anime-media'

/**
 * Builds the home-page carousel slides.
 *
 * @remarks
 * **Pipeline (≤ 3 cold queries):** set-based eligibility in SQL → one batched
 * media fan-out → one batched genre fan-out → {@link mapCarouselItem}.
 * An empty eligibility short-circuits before any fan-out. Slides are cached
 * under the dedicated `anime:carousel:` prefix.
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
        const [mediaByAnime, genreRows] = await Promise.all([
          getAnimeMediaByIds(malIds),
          animeTaxonomyRepository.getGenresByAnimeIds(malIds),
        ])

        const genresByAnime = new Map<number, GenreDB[]>()
        for (const { animeId, ...genre } of genreRows) {
          const list = genresByAnime.get(animeId)
          if (list) {
            list.push(genre)
          } else {
            genresByAnime.set(animeId, [genre])
          }
        }

        return animeList.map((anime) =>
          mapCarouselItem({
            anime,
            media: mediaByAnime[anime.malId] ?? ([] as MediaAsset[]),
            genres: genresByAnime.get(anime.malId) ?? [],
          })
        )
      },
    })
  },
}
