/**
 * Maps the rows of a printed work to the extended (`/full`) payload.
 *
 * @module domains/manga/mappers/manga-full/mapper
 */
import { mapMangaDetails } from '@manga/mappers/manga-mapper'
import type { MangaFullDetails } from '@manga/types'
import { buildMangaTitles, groupMangaRelations } from './helpers'
import type { MapMangaFullInput } from './types'

/**
 * Builds the extended payload on top of the detail DTO.
 *
 * @param input - Detail rows plus taxonomy ids and synonyms
 * @returns {@link MangaFullDetails} with nested taxonomy, titles and relations
 *
 * @remarks
 * Reuses {@link mapMangaDetails} for the shared fields so both payloads stay
 * consistent; only the nested shapes are built here.
 */
export const mapMangaToFullDetails = (
  input: MapMangaFullInput
): MangaFullDetails => {
  const { genres, themes, demographics, related, ...base } =
    mapMangaDetails(input)

  return {
    ...base,
    titles: buildMangaTitles(input.work, input.synonyms),
    genres: input.genres.map(({ genreId, name }) => ({ malId: genreId, name })),
    themes: input.themes.map(({ themeId, name }) => ({ malId: themeId, name })),
    demographics: input.demographics.map(({ demographicId, name }) => ({
      malId: demographicId,
      name,
    })),
    relations: groupMangaRelations(input.related),
  }
}
