/**
 * Public exports for anime domain repositories.
 *
 * @module domains/anime/repositories
 * @remarks
 * Drizzle data-access layer. All methods wrap failures in {@link InfraError} via
 * `dbError` (HTTP 500 at the API boundary).
 *
 * @see {@link animeService} — orchestrates repositories + mappers + cache
 */
export * from './anime-characters-repository'
export * from './anime-external-repository'
export * from './anime-list-filters'
export * from './anime-list-repository'
export * from './anime-relations-repository'
export * from './anime-repository'
export * from './anime-staff-repository'
export * from './anime-taxonomy-repository'
export * from './anime-title-repository'
export * from './character-repository'
export * from './character-staff-repository'
export * from './staff-repository'
