/**
 * Type definitions for the carousel mapper.
 *
 * @module domains/anime/mappers/anime-carousel/types
 */
import type { AnimeDB, GenreDB } from '@anime/types'
import type { MediaAsset } from '@media/types'

/** Input for mapping one anime row into a carousel slide. */
export interface MapCarouselItemInput {
  anime: AnimeDB
  media: MediaAsset[]
  genres: GenreDB[]
}
