import { integer, text, sqliteTable } from 'drizzle-orm/sqlite-core'
import { user } from '@/core/db/schemas/auth-schema'
export const profile = sqliteTable('profile', {
  id: text('id').primaryKey().notNull(),
  userId: integer('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  avatar: text('avatar'),
  name: text('name').notNull(),
  lastName: text('last_name').notNull(),
  birthday: text('birthday'),
  gender: text('gender'),
  favoriteAnimes: text('favorite_animes'),
  favoriteGenres: text('favorite_genres'),
  favoriteStudios: text('favorite_studios'),
  frequency: text('frequency'),
  fanaticLevel: text('fanatic_level'),
  preferredFormat: text('preferred_format'),
  watchedAnimes: text('watched_animes'),
})
