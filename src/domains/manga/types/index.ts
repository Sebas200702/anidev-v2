/**
 * Public exports for the printed-media (manga) domain types.
 *
 * @module domains/manga/types
 * @remarks
 * All exports are type-only. The DB shapes are Drizzle `InferSelectModel` rows
 * and the API shapes are `z.infer` from the Zod schemas in
 * `domains/manga/schemas`.
 *
 * The taxonomy, staff, character and publisher entities are **shared** with
 * the anime domain: a manga author and the same person voice-acting an anime
 * are one and the same row.
 */

export type {
  MangaDB,
  MangaTitleSynonymDB,
  MangaExternalIdsDB,
  MangaMediaDB,
  MangaExternalLinkDB,
} from './manga-db.d-types'

export type {
  MangaRelationsDB,
  MangaCharacterDB,
  MangaProducerDB,
  MangaStaffDB,
  MangaThemeDB,
  MangaGenreDB,
  MangaDemographicDB,
} from './manga-relations.d-types'

export type {
  MangaCard,
  MangaCastMember,
  MangaDetails,
  MangaFullDetails,
  MangaFilters,
  MangaFiltersParams,
} from './manga-api.d-types'
