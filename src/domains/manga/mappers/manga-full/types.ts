/**
 * Input types of the extended printed-media mapper.
 *
 * @module domains/manga/mappers/manga-full/types
 */
import type { MapMangaDetailsInput } from '@manga/mappers/manga-mapper'

/**
 * Rows behind `/api/manga/:malId/full`: the detail rows plus the taxonomy ids
 * and the title synonyms.
 */
export type MapMangaFullInput = Omit<
  MapMangaDetailsInput,
  'genres' | 'themes' | 'demographics'
> & {
  genres: { genreId: number; name: string }[]
  themes: { themeId: number; name: string }[]
  demographics: { demographicId: number; name: string }[]
  synonyms: string[]
}
