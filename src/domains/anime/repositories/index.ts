/**
 * Public exports for anime domain repositories.
 *
 * @module domains/anime/repositories
 * @remarks
 * Drizzle data-access layer. All methods wrap failures in {@link InfraError} via
 * `dbError` (HTTP 500 at the API boundary). Each repository is a self-contained
 * unit folder (repository + optional filters/types).
 *
 * @see {@link animeService} — orchestrates repositories + mappers + cache
 */

export { animeCarouselRepository } from './anime-carousel'
export { animeCharacterRepository } from './anime-characters'
export { animeExternalRepository } from './anime-external'
export { buildAnimeListFilters, type AnimeListFilterParams } from './anime-list'
export { animeListRepository } from './anime-list'
export { animeRelationsRepository } from './anime-relations'
export { animeRepository } from './anime'
export { animeStaffRepository } from './anime-staff'
export { animeTaxonomyRepository } from './anime-taxonomy'
export { animeTitleRepository } from './anime-title'
export { characterRepository } from './character'
export { characterStaffRepository } from './character-staff'
export { staffRepository } from './staff'
