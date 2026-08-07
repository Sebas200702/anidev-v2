/**
 * @module lib/db/schemas/producer-media
 *
 * Logo and promotional media URLs for anime production companies. Follows the
 * standard media asset column layout shared across entity media tables.
 *
 * @remarks
 * Cascade-deletes when parent producer is removed. Used for studio logos on
 * anime detail and producer profile views.
 *
 * @see {@link module:lib/db/schemas/producer} for parent producer entity
 */
import { integer, pgTable, serial, text } from 'drizzle-orm/pg-core'
import { producer } from '@db/schemas/producer'

/**
 * Logo and media URLs (`producer_media` table) associated with a producer.
 *
 * **Key columns:**
 * - `producerId` — FK to {@link producer.malId}; cascade on delete.
 * - `mediaType` — Asset category (logo, banner, etc.).
 * - `src` — Media URL or path.
 * - `size` — Optional variant label.
 */
export const producerMedia = pgTable('producer_media', {
  id: serial('id').primaryKey(),
  producerId: integer('producer_id')
    .notNull()
    .references(() => producer.malId, { onDelete: 'cascade' }),
  mediaType: text('media_type').notNull(),
  src: text('src').notNull(),
  size: text('size'),
})
