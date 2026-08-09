/**
 * Type definitions for the full anime detail mapper.
 *
 * @module domains/anime/mappers/anime-full/types
 */
import type {
  AnimeDB,
  AnimeExternalDB,
  AnimeRelationsDB,
  AnimeTitleSynonymDB,
  DemographicDB,
  GenreDB,
  ThemeDB,
} from '@anime/types'
import type { MusicDB } from '@music/types'
import type { MediaAsset } from '@media/types/media-types'

/**
 * Input for assembling a full anime detail payload.
 *
 * @see {@link animeFullService.getAnimeFullByMalId}
 */
export interface MapAnimeToFullDetailsInput {
  anime: AnimeDB
  genres: GenreDB[]
  themes: ThemeDB[]
  demographics: DemographicDB[]
  media: MediaAsset[]
  titleSynonyms: AnimeTitleSynonymDB[]
  relations: AnimeRelationsDB[]
  relationData: AnimeDB[]
  externalIds: AnimeExternalDB
  animeMusic: MusicDB[]
}
