/**
 * @module lib/db/schemas/music-media
 *
 * Cover art and related visual media attached to music catalog entries.
 * Uses the shared media column pattern (`mediaType`, `src`, `size`).
 *
 * @remarks
 * Cascade-deletes when parent music row is removed. Multiple assets per track
 * are supported for thumbnails, full covers, and alternate art.
 *
 * @see {@link module:lib/db/schemas/music} for parent music entity
 */
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { music } from '@db/schemas/music'

/**
 * Cover art and related media (`music_media` table) linked to a music track.
 *
 * **Key columns:**
 * - `musicId` — FK to {@link music.id}; cascade on delete.
 * - `mediaType` — Asset type label (cover, thumbnail, etc.).
 * - `src` — Image URL or CDN path.
 * - `size` — Optional variant (small, large).
 */
export const musicMedia = sqliteTable('music_media', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  musicId: integer('music_id')
    .notNull()
    .references(() => music.id, { onDelete: 'cascade' }),
  mediaType: text('media_type').notNull(),
  src: text('src').notNull(),
  size: text('size'),
})
