import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { anime } from '@/core/db/schemas/anime'

export const animeMedia = sqliteTable('anime_media', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  animeId: integer('anime_id')
    .notNull()
    .references(() => anime.malId, { onDelete: 'cascade' }),
  mediaType: text('media_type').notNull(),
  src: text('src').notNull(),
  size: text('size'),
})
