/**
 * @module lib/db/schemas/manga-external
 *
 * Cross-platform external identifiers for printed-media entries, enabling deep
 * links and sync with AniList, Kitsu and other catalogs.
 *
 * @remarks
 * One row per work (`mangaId` primary key). Nullable external ids reflect
 * availability from the import sources.
 *
 * @see {@link module:lib/db/schemas/manga} for parent MAL-keyed row
 * @see {@link module:lib/db/schemas/anime-external} for the anime counterpart
 */
import { integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

import { manga } from '@db/schemas/manga'

/**
 * Cross-service IDs (`manga_external_ids` table) for a single work.
 *
 * **Key columns:**
 * - `mangaId` — Primary key and FK to {@link manga.malId}.
 * - `anilistId` — AniList media id.
 * - `kitsuId` — Kitsu numeric id.
 * - `tvdbId` — TheTVDB numeric id.
 * - `malId` — Legacy alias kept for parity with {@link module:lib/db/schemas/anime-external}.
 */
export const mangaExternalIds = pgTable('manga_external_ids', {
  mangaId: integer('manga_id')
    .notNull()
    .primaryKey()
    .references(() => manga.malId),

  anilistId: integer('anilist_id'),
  kitsuId: integer('kitsu_id'),
  tvdbId: integer('tvdb_id'),
  anilistSiteId: text('anilist_site_id'),

  createdAt: timestamp('created_at')
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: timestamp('updated_at')
    .notNull()
    .$defaultFn(() => new Date()),
})
