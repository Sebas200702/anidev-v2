import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { producer } from '@/core/db/schemas/producer'

export const producerMedia = sqliteTable('producer_media', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  producerId: integer('producer_id')
    .notNull()
    .references(() => producer.malId, { onDelete: 'cascade' }),
  mediaType: text('media_type').notNull(),
  src: text('src').notNull(),
  size: text('size'),
})
