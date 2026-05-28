/**
 * @module lib/db/schemas/anime-media
 *
 * Image and media asset URLs attached to anime catalog records. Supports
 * multiple assets per anime with type and size metadata for responsive UI.
 *
 * @remarks
 * `mediaType` and `size` are free-text labels aligned with upstream import
 * conventions (e.g. poster, fanart, small/large). URLs are stored as absolute
 * or CDN paths in `src`.
 *
 * @see {@link module:lib/db/schemas/anime} for parent anime entity
 */
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { anime } from '@db/schemas/anime'

/**
 * Image and media URLs (`anime_media` table) associated with an anime record.
 *
 * **Key columns:**
 * - `animeId` — FK to {@link anime.malId}; cascade on delete.
 * - `mediaType` — Asset category (poster, banner, etc.); required.
 * - `src` — URL or path to the media resource; required.
 * - `size` — Optional variant label (e.g. `large`, `webp`).
 *
 * @see {@link anime} parent anime row
 */
export const animeMedia = sqliteTable('anime_media', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  animeId: integer('anime_id')
    .notNull()
    .references(() => anime.malId, { onDelete: 'cascade' }),
  mediaType: text('media_type').notNull(),
  src: text('src').notNull(),
  size: text('size'),
})
