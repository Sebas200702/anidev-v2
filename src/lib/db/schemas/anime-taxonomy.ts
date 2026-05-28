/**
 * @module lib/db/schemas/anime-taxonomy
 *
 * Shared lookup tables for anime classification: genres, themes, and
 * demographics. Referenced by junction tables in
 * {@link module:lib/db/schemas/anime-relations} for many-to-many tagging.
 *
 * @remarks
 * All taxonomy entities use MyAnimeList numeric IDs as primary keys to stay
 * aligned with upstream catalog imports. Names are denormalized display strings.
 *
 * @see {@link module:lib/db/schemas/anime-relations} for anime ↔ taxonomy links
 */
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

/**
 * Genre lookup values (`genre` table) keyed by MyAnimeList ID.
 *
 * **Key columns:**
 * - `malId` — Primary key; MAL genre id.
 * - `name` — Human-readable genre label (e.g. Action, Romance).
 */
export const genre = sqliteTable('genre', {
  malId: integer('mal_id').primaryKey(),
  name: text('name').notNull(),
})

/**
 * Theme lookup values (`theme` table) keyed by MyAnimeList ID.
 *
 * **Key columns:**
 * - `malId` — Primary key; MAL theme id.
 * - `name` — Theme label (e.g. School, Military).
 */
export const theme = sqliteTable('theme', {
  malId: integer('mal_id').primaryKey(),
  name: text('name').notNull(),
})

/**
 * Demographic lookup values (`demographic` table) keyed by MyAnimeList ID.
 *
 * **Key columns:**
 * - `malId` — Primary key; MAL demographic id.
 * - `name` — Demographic label (e.g. Shounen, Josei).
 */
export const demographic = sqliteTable('demographic', {
  malId: integer('mal_id').primaryKey(),
  name: text('name').notNull(),
})
