/**
 * @module lib/db/schemas/anime-relations
 *
 * Junction and association tables linking anime to taxonomy, staff, characters,
 * music, producers, and related anime titles. Encodes many-to-many relationships
 * with composite primary keys and role metadata where applicable.
 *
 * @remarks
 * Most junction tables cascade-delete when parent anime or related entity is
 * removed. Composite keys prevent duplicate links while allowing multiple roles
 * (e.g. same staff with different `role` strings on {@link animeStaff}).
 *
 * @see {@link module:lib/db/schemas/anime} for anime root entity
 * @see {@link module:lib/db/schemas/anime-taxonomy} for genre/theme/demographic lookups
 * @see {@link module:lib/db/schemas/character} for character entities
 * @see {@link module:lib/db/schemas/staff} for staff entities
 */
import { anime } from '@db/schemas/anime'
import { music } from '@db/schemas/music'
import { character } from '@db/schemas/character'
import { producer } from '@db/schemas/producer'
import { genre, demographic, theme } from '@db/schemas/anime-taxonomy'
import { staff } from '@db/schemas/staff'

import { integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core'

/**
 * Anime-to-genre association (`anime_genre` table).
 *
 * **Key columns:** `animeId`, `genreId` — composite primary key; both FKs cascade.
 */
export const animeGenre = sqliteTable(
  'anime_genre',
  {
    animeId: integer('anime_id')
      .notNull()
      .references(() => anime.malId, { onDelete: 'cascade' }),
    genreId: integer('genre_id')
      .notNull()
      .references(() => genre.malId, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.animeId, t.genreId] })]
)

/**
 * Anime-to-theme association (`anime_theme` table).
 *
 * **Key columns:** `animeId`, `themeId` — composite primary key.
 */
export const animeTheme = sqliteTable(
  'anime_theme',
  {
    animeId: integer('anime_id')
      .notNull()
      .references(() => anime.malId, { onDelete: 'cascade' }),
    themeId: integer('theme_id')
      .notNull()
      .references(() => theme.malId, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.animeId, t.themeId] })]
)

/**
 * Anime-to-demographic association (`anime_demographic` table).
 *
 * **Key columns:** `animeId`, `demographicId` — composite primary key.
 */
export const animeDemographic = sqliteTable(
  'anime_demographic',
  {
    animeId: integer('anime_id')
      .notNull()
      .references(() => anime.malId, { onDelete: 'cascade' }),
    demographicId: integer('demographic_id')
      .notNull()
      .references(() => demographic.malId, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.animeId, t.demographicId] })]
)

/**
 * Staff credits (`anime_staff` table) attached to an anime with role metadata.
 *
 * **Key columns:**
 * - `animeId`, `staffId`, `role` — composite PK; allows duplicate staff with different roles.
 * - `role` — Free-text credit (Director, Series Composition, etc.).
 */
export const animeStaff = sqliteTable(
  'anime_staff',
  {
    animeId: integer('anime_id')
      .notNull()
      .references(() => anime.malId, { onDelete: 'cascade' }),
    staffId: integer('staff_id')
      .notNull()
      .references(() => staff.malId, { onDelete: 'cascade' }),
    role: text('role').notNull(),
  },
  (t) => [primaryKey({ columns: [t.animeId, t.staffId, t.role] })]
)

/**
 * Theme or soundtrack track links (`anime_music` table) between anime and music.
 *
 * **Key columns:** `animeId`, `musicId` — composite primary key.
 */
export const animeMusic = sqliteTable(
  'anime_music',
  {
    animeId: integer('anime_id')
      .references(() => anime.malId)
      .notNull(),
    musicId: integer('music_id')
      .references(() => music.id)
      .notNull(),
  },
  (t) => [primaryKey({ columns: [t.animeId, t.musicId] })]
)

/**
 * Character appearances (`anime_character` table) on an anime with role metadata.
 *
 * **Key columns:**
 * - `animeId`, `characterId`, `role` — composite PK.
 * - `role` — Main, Supporting, etc.
 */
export const animeCharacter = sqliteTable(
  'anime_character',
  {
    animeId: integer('anime_id')
      .notNull()
      .references(() => anime.malId, { onDelete: 'cascade' }),
    characterId: integer('character_id')
      .notNull()
      .references(() => character.malId, { onDelete: 'cascade' }),
    role: text('role').notNull(),
  },
  (t) => [primaryKey({ columns: [t.animeId, t.characterId, t.role] })]
)

/**
 * Related anime entries (`anime_relation` table) with relation type metadata.
 *
 * **Key columns:**
 * - `animeId`, `relatedAnimeId`, `relationType` — composite PK.
 * - `relationType` — Sequel, Prequel, Side story, etc.
 */
export const animeRelatedAnime = sqliteTable(
  'anime_relation',
  {
    animeId: integer('anime_id')
      .references(() => anime.malId)
      .notNull(),
    relationType: text('relation_type').notNull(),
    relatedAnimeId: integer('related_anime_id')
      .references(() => anime.malId)
      .notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.animeId, t.relatedAnimeId, t.relationType] }),
  ]
)

/**
 * Production company links (`anime_producer` table) between anime and producers.
 *
 * **Key columns:** `animeId`, `producerId` — composite primary key.
 */
export const animeProducer = sqliteTable(
  'anime_producer',
  {
    animeId: integer('anime_id')
      .notNull()
      .references(() => anime.malId, { onDelete: 'cascade' }),
    producerId: integer('producer_id')
      .notNull()
      .references(() => producer.malId, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.animeId, t.producerId] })]
)
