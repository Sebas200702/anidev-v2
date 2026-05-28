/**
 * @module lib/db/schemas
 *
 * Barrel re-export of all Drizzle ORM schema definitions for the AniDev SQLite
 * database. Tables cover authentication (Better Auth), anime catalog metadata,
 * related media entities, junction relations, and extended user profiles.
 *
 * @remarks
 * Import from `@db/schemas` when repositories need multiple table symbols.
 * Import individual schema files (e.g. `@db/schemas/anime`) when isolating
 * dependencies or avoiding circular imports between relation modules.
 *
 * **Re-exports (grouped):**
 * - Anime core: `anime`, `animeTitleSynonym`, media, external IDs, relations, taxonomy
 * - People: `character`, `staff`, `producer`, `artist` and their media/relations
 * - Episodes: `episode`, sources, subtitles, media
 * - Music: `music`, versions, resolutions, media, artist links
 * - Auth: `user`, `session`, `account`, `verification` (+ relations)
 * - Profile: `profile` extended user preferences
 *
 * @see {@link module:lib/db/client} for query execution
 * @see {@link module:lib/auth/server} for auth table adapter mapping
 */
export * from './anime-external'
export * from './anime-media'
export * from './anime-relations'
export * from './anime-taxonomy'
export * from './anime'
export * from './artist'
export * from './auth-schema'
export * from './character-media'
export * from './character-relations'
export * from './character'
export * from './episode-media'
export * from './episode'
export * from './music-media'
export * from './music-relations'
export * from './music'
export * from './producer-media'
export * from './producer'
export * from './profile'
export * from './staff-media'
export * from './staff'
