/**
 * Public exports for the printed-media (manga) domain.
 *
 * @module domains/manga
 * @remarks The printed-media catalog (manga, novels, one-shots) mirrors the
 * anime domain: repositories → service → mapper → cache → schema → API.
 */

export {
  mangaListService,
  mangaDetailsService,
  mangaFullService,
} from './services'
export { mangaListRepository, mangaDetailsRepository } from './repositories'
export { mapMangaCard, mapMangaDetails } from './mappers'
export { mangaListCache } from './cache'
export * from './schemas'
export type * from './types'
