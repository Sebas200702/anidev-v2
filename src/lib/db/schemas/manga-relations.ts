/**
 * @module lib/db/schemas/manga-relations
 *
 * Junction tables linking printed media to the entities of the catalog:
 * taxonomy (genre/theme/demographic), staff (authors, artists, editors),
 * characters, producers (publishers) and related works.
 *
 * @remarks
 * The taxonomy, staff, character and producer entities are **shared** with the
 * anime domain: an author of a manga and the same person voicing an anime are
 * the same {@link module:lib/db/schemas/staff.staff} row. Only the link tables
 * are duplicated, so the app can cross-link "same author" across media.
 *
 * @see {@link module:lib/db/schemas/manga} for the printed-media root
 * @see {@link module:lib/db/schemas/anime-entity-relations} for the anime side
 */
import { index, integer, primaryKey, pgTable, text } from 'drizzle-orm/pg-core'

import { character } from '@db/schemas/character'
import { demographic, genre, theme } from '@db/schemas/anime-taxonomy'
import { manga } from '@db/schemas/manga'
import { producer } from '@db/schemas/producer'
import { staff } from '@db/schemas/staff'

/** Genre link (`manga_genre` table). */
export const mangaGenre = pgTable(
  'manga_genre',
  {
    mangaId: integer('manga_id')
      .notNull()
      .references(() => manga.malId, { onDelete: 'cascade' }),
    genreId: integer('genre_id')
      .notNull()
      .references(() => genre.malId, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.mangaId, t.genreId] })]
)

/** Theme link (`manga_theme` table). */
export const mangaTheme = pgTable(
  'manga_theme',
  {
    mangaId: integer('manga_id')
      .notNull()
      .references(() => manga.malId, { onDelete: 'cascade' }),
    themeId: integer('theme_id')
      .notNull()
      .references(() => theme.malId, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.mangaId, t.themeId] })]
)

/** Demographic link (`manga_demographic` table). */
export const mangaDemographic = pgTable(
  'manga_demographic',
  {
    mangaId: integer('manga_id')
      .notNull()
      .references(() => manga.malId, { onDelete: 'cascade' }),
    demographicId: integer('demographic_id')
      .notNull()
      .references(() => demographic.malId, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.mangaId, t.demographicId] })]
)

/**
 * Staff credits (`manga_staff` table): authors, artists, editors, assistants.
 *
 * **Key columns:**
 * - `mangaId`, `staffId`, `role` — composite PK; the same person can hold
 *   two roles on the same work (e.g. author and illustrator).
 */
export const mangaStaff = pgTable(
  'manga_staff',
  {
    mangaId: integer('manga_id')
      .notNull()
      .references(() => manga.malId, { onDelete: 'cascade' }),
    staffId: integer('staff_id')
      .notNull()
      .references(() => staff.malId, { onDelete: 'cascade' }),
    role: text('role').notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.mangaId, t.staffId, t.role] }),
    index('manga_staff_staff_id_idx').on(t.staffId),
  ]
)

/**
 * Character appearances (`manga_character` table) on a printed work.
 *
 * **Key columns:**
 * - `mangaId`, `characterId`, `role` — composite PK.
 */
export const mangaCharacter = pgTable(
  'manga_character',
  {
    mangaId: integer('manga_id')
      .notNull()
      .references(() => manga.malId, { onDelete: 'cascade' }),
    characterId: integer('character_id')
      .notNull()
      .references(() => character.malId, { onDelete: 'cascade' }),
    role: text('role').notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.mangaId, t.characterId, t.role] }),
    index('manga_character_character_id_idx').on(t.characterId),
  ]
)

/**
 * Publisher links (`manga_producer` table) between a work and a company.
 *
 * **Key columns:**
 * - `mangaId`, `producerId`, `role` — composite PK; `role` discriminates
 *   `publisher`, `imprint` and `serialization`.
 */
export const mangaProducer = pgTable(
  'manga_producer',
  {
    mangaId: integer('manga_id')
      .notNull()
      .references(() => manga.malId, { onDelete: 'cascade' }),
    producerId: integer('producer_id')
      .notNull()
      .references(() => producer.malId, { onDelete: 'cascade' }),
    role: text('role').notNull().default('publisher'),
  },
  (t) => [
    primaryKey({ columns: [t.mangaId, t.producerId, t.role] }),
    index('manga_producer_role_idx').on(t.role, t.producerId),
  ]
)

/**
 * Related works (`manga_relation` table): adaptations, sequels, side stories.
 *
 * **Key columns:**
 * - `mangaId`, `relatedMangaId`, `relationType` — composite PK.
 * - `relationType` — `ADAPTATION`, `SIDE_STORY`, `PREQUEL`, …
 */
export const mangaRelation = pgTable(
  'manga_relation',
  {
    mangaId: integer('manga_id')
      .notNull()
      .references(() => manga.malId, { onDelete: 'cascade' }),
    relatedMangaId: integer('related_manga_id')
      .notNull()
      .references(() => manga.malId, { onDelete: 'cascade' }),
    relationType: text('relation_type').notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.mangaId, t.relatedMangaId, t.relationType] }),
    index('manga_relation_related_manga_id_idx').on(t.relatedMangaId),
  ]
)
