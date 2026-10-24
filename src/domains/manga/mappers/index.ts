/**
 * Public exports for the printed-media (manga) domain mappers.
 *
 * @module domains/manga/mappers
 */

export { mapMangaCard, mapMangaDetails } from './manga-mapper'
export type { MapMangaDetailsInput } from './manga-mapper'
export { mapMangaCast } from './manga-cast'
export type { MangaCastRow, MangaVoiceActorInput } from './manga-cast'
export { mapMangaToFullDetails } from './manga-full'
export type { MapMangaFullInput } from './manga-full'
