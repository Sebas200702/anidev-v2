/**
 * @module lib/db/schemas
 *
 * Named re-exports of all Drizzle ORM schema definitions for the AniDev SQLite
 * database. Tables cover authentication (Better Auth), anime catalog metadata,
 * related media entities, junction relations, and extended user profiles.
 *
 * @remarks
 * Import from `@db/schemas` when repositories need multiple table symbols.
 * Import individual schema files (e.g. `@db/schemas/anime`) when isolating
 * dependencies or avoiding circular imports between relation modules.
 *
 * @see {@link module:lib/db/client} for query execution
 * @see {@link module:lib/auth/server} for auth table adapter mapping
 */

export { anime, animeTitleSynonym } from './anime'
export { animeExternalIds } from './anime-external'
export { animeMedia } from './anime-media'
export { animeStaff, animeMusic, animeCharacter, animeRelatedAnime, animeProducer } from './anime-entity-relations'
export { animeGenre, animeTheme, animeDemographic } from './anime-taxonomy-relations'
export { genre, theme, demographic } from './anime-taxonomy'
export { artist } from './artist'
export { user, session, account, verification, userRelations, sessionRelations, accountRelations } from './auth-schema'
export { character, characterNickname } from './character'
export { characterMedia } from './character-media'
export { characterVoiceActor } from './character-relations'
export { episode, episodeSource, episodeSubtitle } from './episode'
export { episodeMedia } from './episode-media'
export { music, musicVersion, musicResolution } from './music'
export { musicMedia } from './music-media'
export { musicArtist } from './music-relations'
export { producer, producerTitle } from './producer'
export { producerMedia } from './producer-media'
export { profile } from './profile'
export { staff, staffAlternativeName } from './staff'
export { staffMedia } from './staff-media'
