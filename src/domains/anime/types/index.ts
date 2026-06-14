/**
 * Public exports for anime domain types.
 *
 * @module domains/anime/types
 * @remarks
 * All exports are type-only (`export type`) since this barrel only re-exports
 * TypeScript type definitions and interfaces — no runtime values.
 *
 * - **DB types** (`*DB`) — Drizzle `InferSelectModel` row shapes
 * - **API types** — `z.infer` from Zod schemas in `domains/anime/schemas`
 */

export type { AnimeCard } from './anime-card.d-types'
export type { VoiceActor, AnimeCharacter, GetAnimeCharacter, AnimeCharacterResponse } from './anime-character.d-types'
export type {
  AnimeDB,
  AnimeTitleSynonymDB,
  AnimeExternalDB,
  CharacterDB,
  CharacterNicknameDB,
  ProducerDB,
  StaffDB,
  GenreDB,
  ThemeDB,
  DemographicDB,
} from './anime-db.d-types'
export type { AnimeRelationsDB, AnimeCharacterDB, AnimeProducerDB, AnimeStaffDB, AnimeThemeDB, AnimeGenreDB, CharacterVoiceActorDB } from './anime-relations.d-types'
export type { AnimeDetails } from './anime-details.d-types'
export type { AnimeFullDetails, AnimeRelations, AnimeTitle, AnimeGenre, AnimeMedia, AnimeMusic, AnimeExternalIds, AnimeFullDetailsResponse } from './anime-full.d-types'
export type { AnimeFilters, AnimeFiltersParams, AnimeListResponse } from './anime-list.d-types'
export type { AnimeStaff } from './anime-staff.d-types'
