/**
 * @module lib/db/schemas/profile
 *
 * Extended user profile and anime preference fields linked to Better Auth
 * users. Stores onboarding choices, favorites, and display metadata separate
 * from core auth credentials in {@link module:lib/db/schemas/auth-schema}.
 *
 * @remarks
 * One profile row per auth user (enforced at application layer). Several fields
 * store serialized list data as text (JSON or comma-separated — see domain
 * mappers). `userId` references {@link user.id} with cascade delete.
 *
 * @see {@link module:lib/db/schemas/auth-schema.user} for auth user root
 * @see {@link module:lib/cache/config.CacheKeyPrefix.UserProfile} for profile cache keys
 */
import { integer, text, sqliteTable } from 'drizzle-orm/sqlite-core'
import { user } from '@db/schemas/auth-schema'

/**
 * Application profile and anime preferences (`profile` table) for a user.
 *
 * **Key columns:**
 * - `id` — Text primary key (profile id, may mirror or differ from user id).
 * - `userId` — FK to {@link user.id}; cascade on delete.
 * - `avatar` — Optional avatar URL override.
 * - `name` / `lastName` — Display name fields (required).
 * - `birthday` / `gender` — Optional demographic fields from onboarding.
 * - `favoriteAnimes` / `favoriteGenres` / `favoriteStudios` — Serialized preference lists.
 * - `frequency` / `fanaticLevel` / `preferredFormat` — Viewing habit questionnaire answers.
 * - `watchedAnimes` — Serialized watch history or list snapshot.
 */
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
