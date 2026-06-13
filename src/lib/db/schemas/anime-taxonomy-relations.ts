/**
 * @module lib/db/schemas/anime-taxonomy-relations
 *
 * Junction tables linking anime to taxonomy lookups (genre, theme, demographic). Each encodes a
 * many-to-many relationship with a composite primary key; both foreign keys cascade on delete.
 *
 * @see {@link module:lib/db/schemas/anime-taxonomy} for genre/theme/demographic lookups
 * @see {@link module:lib/db/schemas/anime-relations} for the aggregating re-export
 */
import { anime } from '@db/schemas/anime'
import { genre, demographic, theme } from '@db/schemas/anime-taxonomy'

import { integer, primaryKey, sqliteTable } from 'drizzle-orm/sqlite-core'

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
