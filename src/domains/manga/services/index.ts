/**
 * Public exports for the printed-media (manga) domain services.
 *
 * @module domains/manga/services
 * @remarks Each service implements read-through caching over repositories and
 * mappers. HTTP routes validate input with Zod schemas then call these APIs.
 */

export {
  mangaListService,
  mangaDetailsService,
  mapMangaFilters,
} from './manga-service'
