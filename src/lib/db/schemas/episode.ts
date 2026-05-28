/**
 * @module lib/db/schemas/episode
 *
 * Episode-level metadata for anime series: core episode rows, streaming source
 * URLs, and per-language subtitle tracks. Scoped to a parent anime via FK.
 *
 * @remarks
 * Episode numbers are unique per anime (`episode_anime_number_unique`). Sources
 * and subtitles cascade-delete when an episode row is removed. Duration and
 * aired fields are stored as text to preserve upstream formatting.
 *
 * @see {@link module:lib/db/schemas/anime} for parent series
 * @see {@link module:lib/db/schemas/episode-media} for episode thumbnails
 */
import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core'
import { anime } from '@db/schemas/anime'

/**
 * Episode record (`episode` table) scoped to a parent anime series.
 *
 * **Key columns:**
 * - `id` — Surrogate primary key (auto-increment).
 * - `animeId` — FK to {@link anime.malId}; cascade on delete.
 * - `number` — Episode index within series; unique per anime.
 * - `title` — Episode title (required).
 * - `synopsis` / `duration` / `aired` — Optional descriptive metadata.
 */
export const episode = sqliteTable(
  'episode',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    animeId: integer('anime_id')
      .notNull()
      .references(() => anime.malId, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    synopsis: text('synopsis'),
    duration: text('duration'),
    aired: text('aired'),
    number: integer('number').notNull(),
  },
  (t) => [uniqueIndex('episode_anime_number_unique').on(t.animeId, t.number)]
)

/**
 * Streaming or download source URL (`episode_source` table) for an episode.
 *
 * **Key columns:**
 * - `episodeId` — FK to {@link episode.id}; cascade on delete.
 * - `src` — Stream or file URL; unique per `(episodeId, src)`.
 */
export const episodeSource = sqliteTable(
  'episode_source',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    episodeId: integer('episode_id')
      .notNull()
      .references(() => episode.id, { onDelete: 'cascade' }),
    src: text('src').notNull(),
  },
  (t) => [uniqueIndex('episode_source_unique').on(t.episodeId, t.src)]
)

/**
 * Subtitle file (`episode_subtitle` table) for an episode and language.
 *
 * **Key columns:**
 * - `episodeId` — FK to {@link episode.id}.
 * - `language` — Subtitle language code or label.
 * - `src` — Subtitle file URL; unique with episode and language.
 */
export const episodeSubtitle = sqliteTable(
  'episode_subtitle',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    episodeId: integer('episode_id')
      .notNull()
      .references(() => episode.id, { onDelete: 'cascade' }),
    language: text('language').notNull(),
    src: text('src').notNull(),
  },
  (t) => [
    uniqueIndex('episode_subtitle_unique').on(t.episodeId, t.language, t.src),
  ]
)
