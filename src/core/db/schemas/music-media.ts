import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { music } from '@/core/db/schemas/music'

export const musicMedia = sqliteTable('music_media', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  musicId: integer('music_id')
    .notNull()
    .references(() => music.id, { onDelete: 'cascade' }),
  mediaType: text('media_type').notNull(),
  src: text('src').notNull(),
  size: text('size'),
})
