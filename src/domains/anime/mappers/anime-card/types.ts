/**
 * Type definitions for the anime card mapper.
 *
 * @module domains/anime/mappers/anime-card/types
 */
import type { AnimeDB } from '@anime/types'

/** Input for mapping a single anime row to a card. */
export interface MapAnimeCardInput {
  anime: AnimeDB
}

/** Input for mapping multiple anime rows to cards. */
export interface MapAnimeListToCardsInput {
  animeList: AnimeDB[]
}
