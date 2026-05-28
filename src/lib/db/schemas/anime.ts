/**
 * @module lib/db/schemas/anime
 *
 * Core anime catalog tables: primary anime metadata keyed by MyAnimeList ID
 * and alternate title synonyms for search and display localization.
 *
 * @remarks
 * `malId` is the stable primary key across the schema graph. Synonym titles
 * cascade-delete when parent anime rows are removed. Nullable fields mirror
 * MAL optional metadata (e.g. `titleEnglish`, `synopsis`).
 *
 * @see {@link module:lib/db/schemas/anime-relations} for genre/staff/character links
 * @see {@link module:lib/db/schemas/anime-media} for poster and image assets
 * @see {@link module:lib/db/schemas/anime-external} for third-party IDs
 */
import {
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core'

/**
 * Primary anime catalog record (`anime` table) keyed by MyAnimeList ID.
 *
 * **Key columns:**
 * - `malId` — Primary key; MAL numeric anime id.
 * - `title` — Canonical display title (required).
 * - `type` / `status` — MAL type string (TV, Movie, etc.) and airing status.
 * - `score` / `scoredBy` — Community score aggregate and voter count.
 * - `year` / `season` — Broadcast period for filters and sorting.
 * - `synopsis` / `background` — Long-form descriptive text.
 *
 * @see {@link animeTitleSynonym} for alternate searchable titles
 */
export const anime = sqliteTable('anime', {
  malId: integer('mal_id').primaryKey(),
  title: text('title').notNull(),
  titleEnglish: text('title_english'),
  titleJapanese: text('title_japanese'),
  type: text('type'),
  status: text('status'),
  episodes: integer('episodes'),
  score: real('score'),
  scoredBy: integer('scored_by'),
  popularityRank: integer('popularity_rank'),
  rating: text('rating'),
  year: integer('year'),
  season: text('season'),
  synopsis: text('synopsis'),
  background: text('background'),
})

/**
 * Alternate or localized titles (`anime_title_synonym` table) for an anime entry.
 *
 * **Key columns:**
 * - `animeId` — FK to {@link anime.malId}; cascade on delete.
 * - `title` — Synonym string; unique per `(animeId, title)` pair.
 *
 * @see {@link anime} parent record
 */
export const animeTitleSynonym = sqliteTable(
  'anime_title_synonym',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    animeId: integer('anime_id')
      .notNull()
      .references(() => anime.malId, { onDelete: 'cascade' }),
    title: text('title').notNull(),
  },
  (t) => [
    uniqueIndex('anime_title_synonym_anime_id_title_idx').on(
      t.animeId,
      t.title
    ),
  ]
)
