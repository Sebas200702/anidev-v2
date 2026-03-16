// src/core/db/schemas/character-media.ts
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { character } from '@/core/db/schemas/character'

export const characterMedia = sqliteTable('character_media', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  characterId: integer('character_id')
    .notNull()
    .references(() => character.malId, { onDelete: 'cascade' }),
  mediaType: text('media_type').notNull(),
  src: text('src').notNull(),
  size: text('size'),
})
