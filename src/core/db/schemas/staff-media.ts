import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { staff } from '@/core/db/schemas/staff'

export const staffMedia = sqliteTable('staff_media', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  staffId: integer('staff_id')
    .notNull()
    .references(() => staff.malId, { onDelete: 'cascade' }),
  mediaType: text('media_type').notNull(),
  src: text('src').notNull(),
  size: text('size'),
})
