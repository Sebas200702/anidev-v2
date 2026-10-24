/**
 * Works credited to a producer.
 *
 * @module domains/producer/services/producer-works/service
 * @remarks
 * Delegates to the anime and manga list services, so the `safe` parental
 * floor, the ordering and the list caches are the catalog's own. The producer
 * is checked first so an unknown id is a `404`, not an empty page.
 */
import type { ANIME_PRODUCER_ROLES } from '@anime/constants'
import { animeListService } from '@anime/services/anime-list'
import { mangaListService } from '@manga/services/manga-service'
import { producerDetailsService } from '@producer/services/producer-details'

interface WorksPage {
  page: number
  limit: number
}

/** Producer works use cases. */
export const producerWorksService = {
  /**
   * Lists the anime credited to a producer.
   *
   * @param malId - MyAnimeList producer id
   * @param options - Pagination and optional credit `role`
   * @returns The anime list result (`{ list, total }` + stale flag)
   * @throws {DomainError} `PRODUCER_NOT_FOUND`
   * @throws {InfraError} On database failure
   */
  async getAnime(
    malId: number,
    {
      page,
      limit,
      role,
    }: WorksPage & { role?: (typeof ANIME_PRODUCER_ROLES)[number] }
  ) {
    await producerDetailsService.getProducerDetails(malId)
    return animeListService.getAnimeList({
      page,
      limit,
      producer: String(malId),
      producerRole: role,
    })
  },

  /**
   * Lists the printed works a producer (magazine/publisher) is linked to.
   *
   * @param malId - MyAnimeList producer id
   * @param options - Pagination
   * @returns The manga list result (`{ list, total }` + stale flag)
   * @throws {DomainError} `PRODUCER_NOT_FOUND`
   * @throws {InfraError} On database failure
   */
  async getManga(malId: number, { page, limit }: WorksPage) {
    await producerDetailsService.getProducerDetails(malId)
    return mangaListService.getMangaList({ page, limit }, { producerId: malId })
  },
}
