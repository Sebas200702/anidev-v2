/**
 * Type definitions for the anime detail mapper.
 *
 * @module domains/anime/mappers/anime/types
 */
import type { AnimeDB, DemographicDB, GenreDB, ThemeDB } from '@anime/types'
import type { MediaAsset } from '@media/types/media-types'

/**
 * Input for assembling an anime detail payload.
 *
 * @see {@link animeService.getAnimeDetails}
 */
export interface MapAnimeDetailsInput {
  /** Genre rows from {@link animeTaxonomyRepository.getGenresByAnimeId} */
  genres: GenreDB[]
  /** Theme rows */
  themes: ThemeDB[]
  /** Demographic rows */
  demographics: DemographicDB[]
  /** Trailer/poster assets from media repository */
  media: MediaAsset[]
  /** Core `anime` row */
  anime: AnimeDB
}
