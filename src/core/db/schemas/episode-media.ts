import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { episode } from '@/core/db/schemas/episode'

export const episodeMedia = sqliteTable('episode_media', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  episodeId: integer('episode_id')
    .notNull()
    .references(() => episode.id, { onDelete: 'cascade' }),
  mediaType: text('media_type').notNull(),
  src: text('src').notNull(),
  size: text('size'),
})
