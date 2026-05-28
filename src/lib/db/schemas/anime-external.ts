/**
 * @module lib/db/schemas/anime-external
 *
 * Cross-platform external identifiers for anime entries, enabling deep links
 * and sync with AnimeThemes, Kitsu, TVDB, and other metadata services.
 *
 * @remarks
 * One row per anime (`animeId` primary key). Nullable external IDs reflect
 * availability from import sources. Timestamps track last sync for incremental
 * updates.
 *
 * @see {@link module:lib/db/schemas/anime} for parent MAL-keyed anime row
 */
import { integer, text, sqliteTable } from 'drizzle-orm/sqlite-core'

import { anime } from '@db/schemas/anime'

/**
 * Cross-service IDs and slugs (`anime_external_ids` table) for a single anime.
 *
 * **Key columns:**
 * - `animeId` — Primary key and FK to {@link anime.malId}.
 * - `animeThemesSlug` — Slug on AnimeThemes.net when known.
 * - `kitsuId` / `tvdbId` — Numeric external catalog identifiers.
 * - `createdAt` / `updatedAt` — Row lifecycle timestamps (JS `Date` mode).
 *
 * @see {@link anime} canonical anime record
 */
export const animeExternalIds = sqliteTable('anime_external_ids', {
  animeId: integer('anime_id')
    .notNull()
    .primaryKey()
    .references(() => anime.malId),

  animeThemesSlug: text('anime_themes_slug'),
  kitsuId: integer('kitsu_id'),
  tvdbId: integer('tvdb_id'),

  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
})
