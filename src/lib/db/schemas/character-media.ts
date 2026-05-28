/**
 * @module lib/db/schemas/character-media
 *
 * Image and media asset URLs attached to character records. Mirrors the anime
 * media pattern with type and size metadata for gallery and avatar rendering.
 *
 * @remarks
 * Multiple rows per character are allowed (different `mediaType` / `size`).
 * Cascade-delete when parent character is removed.
 *
 * @see {@link module:lib/db/schemas/character} for parent character entity
 */
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { character } from '@db/schemas/character'

/**
 * Image and media URLs (`character_media` table) associated with a character.
 *
 * **Key columns:**
 * - `characterId` — FK to {@link character.malId}; cascade on delete.
 * - `mediaType` — Asset category (image, voice sample, etc.).
 * - `src` — Resource URL or path.
 * - `size` — Optional variant descriptor.
 */
export const characterMedia = sqliteTable('character_media', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  characterId: integer('character_id')
    .notNull()
    .references(() => character.malId, { onDelete: 'cascade' }),
  mediaType: text('media_type').notNull(),
  src: text('src').notNull(),
  size: text('size'),
})
