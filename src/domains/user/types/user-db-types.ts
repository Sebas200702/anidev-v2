/**
 * Drizzle-derived types for user profile database rows.
 *
 * @module domains/user/types/user-db-types
 * @remarks
 * Persistence-layer types inferred from the {@link profile} table schema.
 * List fields (`favoriteAnimes`, `favoriteGenres`, etc.) are stored as
 * comma-separated text in SQLite and parsed into arrays by
 * {@link mapUserProfile}.
 * @see {@link profile} for column definitions
 * @see {@link UserProfile} for the API-facing mapped shape
 */
import { profile } from '@db/schemas/profile'
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm'

/**
 * Selected profile row shape returned by queries.
 *
 * @remarks
 * **Database columns (`profile` table):**
 *
 * | Column | TS type | Nullable | Description |
 * | ------ | ------- | -------- | ----------- |
 * | `id` | `string` | no | Primary key; public profile identifier |
 * | `userId` | `number` | no | FK to auth `user.id` |
 * | `avatar` | `string` | yes | Avatar URL or path |
 * | `name` | `string` | no | Given name |
 * | `lastName` | `string` | no | Family name |
 * | `birthday` | `string` | yes | Birth date string |
 * | `gender` | `string` | yes | Gender stored as text |
 * | `favoriteAnimes` | `string` | yes | CSV of anime media IDs |
 * | `favoriteGenres` | `string` | yes | CSV of genre taxonomy IDs |
 * | `favoriteStudios` | `string` | yes | CSV of studio taxonomy IDs |
 * | `frequency` | `string` | yes | Viewing frequency (`daily`, `weekly`, `monthly`) |
 * | `fanaticLevel` | `string` | yes | Engagement level (`low`, `medium`, `high`) |
 * | `preferredFormat` | `string` | yes | Preferred format label |
 * | `watchedAnimes` | `string` | yes | CSV of watched anime media IDs |
 * @see {@link mapUserProfile} for conversion to {@link UserProfile}
 * @see {@link userRepository.getUserProfileById}
 * @example
 * ```typescript
 * const row: UserProfileDB = await userRepository.getUserProfileById('user-123')
 * ```
 */
export type UserProfileDB = InferSelectModel<typeof profile>

/**
 * Insertable profile row shape for create/update operations.
 *
 * @remarks
 * Same columns as {@link UserProfileDB} but with optional fields appropriate
 * for inserts (e.g. auto-generated keys may be omitted depending on call site).
 * Not yet used by write repositories in this domain but available for future
 * profile mutation endpoints guarded by {@link userPolicies.canEditUserProfile}.
 * @see {@link NewUserProfileDB}
 * @see {@link profile}
 * @example
 * ```typescript
 * const insert: NewUserProfileDB = {
 *   id: 'user-123',
 *   userId: 1,
 *   name: 'Ada',
 *   lastName: 'Lovelace',
 * }
 * ```
 */
export type NewUserProfileDB = InferInsertModel<typeof profile>
