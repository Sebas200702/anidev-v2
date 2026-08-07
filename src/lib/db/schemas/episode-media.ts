/**
 * @module lib/db/schemas/episode-media
 *
 * Thumbnail and preview media assets linked to individual episodes. Follows
 * the shared media table pattern used across anime, character, and music entities.
 *
 * @remarks
 * Cascade-deletes with parent episode. `mediaType` distinguishes thumbnails,
 * previews, and other visual assets.
 *
 * @see {@link module:lib/db/schemas/episode} for parent episode rows
 */
import { integer, pgTable, serial, text } from 'drizzle-orm/pg-core'
import { episode } from '@db/schemas/episode'

/**
 * Thumbnail and preview media (`episode_media` table) linked to an episode.
 *
 * **Key columns:**
 * - `episodeId` — FK to {@link episode.id}; cascade on delete.
 * - `mediaType` — Asset category label.
 * - `src` — Media URL or path.
 * - `size` — Optional resolution/variant label.
 */
export const episodeMedia = pgTable('episode_media', {
  id: serial('id').primaryKey(),
  episodeId: integer('episode_id')
    .notNull()
    .references(() => episode.id, { onDelete: 'cascade' }),
  mediaType: text('media_type').notNull(),
  src: text('src').notNull(),
  size: text('size'),
})
