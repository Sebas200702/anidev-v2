/**
 * Public exports for anime domain mappers.
 *
 * @module domains/anime/mappers
 * @remarks
 * Pure functions from Drizzle rows / join data to API DTOs. No I/O.
 * Each mapper is a self-contained unit folder (logic + types [+ helpers]).
 */

export { mapAnimeCard, mapAnimeListToCards } from './anime-card'
export { mapAnimeCharacters } from './anime-character'
export { mapExternalIds } from './anime-external'
export { mapAnimeFilters } from './anime-filters'
export {
  type RelationGroup,
  mapAnimeToFullDetails,
  buildAnimeTitles,
  groupAnimeRelations,
} from './anime-full'
export { mapAnimeDetails } from './anime'
export { mapMusicListToAnimeMusic } from './anime-music'
export { mapAnimeStaff } from './anime-staff'
