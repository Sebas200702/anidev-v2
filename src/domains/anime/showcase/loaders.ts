/**
 * Data loaders for the anime showcase entries.
 *
 * @module domains/anime/showcase/loaders
 * @remarks
 * These are declared here and **executed by the route**, inside a `try/catch`
 * that falls back to the entry's fixture. Returning `undefined` means "no usable
 * record", which the route reports as a fixture render.
 */
import { animeDetailsFixture } from '@anime/fixtures'
import { animeService } from '@anime/services/anime'
import { animeCarouselService } from '@anime/services/anime-carousel'
import { animeListService } from '@anime/services/anime-list'
import { SHOWCASE_CARD_SEARCH_LIMIT } from '@anime/constants'
import type { ShowcaseLoadOptions } from '@components/showcase'

/** First page of cards, honoring `?id=` when it is on that page. */
export const loadCard = async ({ recordId }: ShowcaseLoadOptions) => {
  const { value } = await animeListService.getAnimeList({
    page: 1,
    limit: SHOWCASE_CARD_SEARCH_LIMIT,
  })
  const match = recordId
    ? value.list.find((card) => card.malId === recordId)
    : undefined
  const anime = match ?? value.list.at(0)

  return anime ? { anime } : undefined
}

/** The live featured slides, plus the one matching `?id=`. */
export const loadCarousel = async ({ recordId }: ShowcaseLoadOptions) => {
  const items = await animeCarouselService.getCarouselItems()
  if (items.length === 0) return undefined

  const match = recordId
    ? items.find((item) => item.malId === recordId)
    : undefined

  return { items, item: match ?? items[0] }
}

/** One anime detail record. */
export const loadDetails = async ({ recordId }: ShowcaseLoadOptions) => {
  const { value } = await animeService.getAnimeDetails(
    recordId ?? animeDetailsFixture.malId
  )

  return value ? { animeDetails: value } : undefined
}
