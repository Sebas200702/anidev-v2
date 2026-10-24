/**
 * Junction row types for the printed-media (manga) domain.
 *
 * @module domains/manga/types/manga-relations
 */
import type { InferSelectModel } from 'drizzle-orm'
import type {
  mangaCharacter,
  mangaDemographic,
  mangaGenre,
  mangaProducer,
  mangaRelation,
  mangaStaff,
  mangaTheme,
} from '@db/schemas/manga-relations'

/** Row shape for the `manga_genre` table. */
export type MangaGenreDB = InferSelectModel<typeof mangaGenre>

/** Row shape for the `manga_theme` table. */
export type MangaThemeDB = InferSelectModel<typeof mangaTheme>

/** Row shape for the `manga_demographic` table. */
export type MangaDemographicDB = InferSelectModel<typeof mangaDemographic>

/** Row shape for the `manga_staff` table (authors, artists, editors). */
export type MangaStaffDB = InferSelectModel<typeof mangaStaff>

/** Row shape for the `manga_character` table. */
export type MangaCharacterDB = InferSelectModel<typeof mangaCharacter>

/** Row shape for the `manga_producer` table (publishers, imprints). */
export type MangaProducerDB = InferSelectModel<typeof mangaProducer>

/** Row shape for the `manga_relation` table. */
export type MangaRelationsDB = InferSelectModel<typeof mangaRelation>
