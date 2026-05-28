/**
 * @module lib/db/schemas/staff
 *
 * Staff member profiles (creators, voice actors, etc.) keyed by MyAnimeList ID,
 * plus alternative name spellings for search and matching.
 *
 * @remarks
 * Staff link to anime via {@link module:lib/db/schemas/anime-relations.animeStaff},
 * to characters as voice actors via
 * {@link module:lib/db/schemas/character-relations}, and optionally to
 * {@link module:lib/db/schemas/artist} via `malId`.
 *
 * @see {@link module:lib/db/schemas/staff-media} for portraits
 * @see {@link module:lib/db/schemas/anime-relations.animeStaff} for production credits
 */
import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core'

/**
 * Staff member profile (`staff` table) keyed by MyAnimeList ID.
 *
 * **Key columns:**
 * - `malId` — Primary key; MAL people id.
 * - `name` — Primary display name (required).
 * - `givenName` / `familyName` — Optional structured name parts.
 * - `birthday` — Birth date as text from import.
 * - `about` — Biography text.
 */
export const staff = sqliteTable('staff', {
  malId: integer('mal_id').primaryKey(),
  name: text('name').notNull(),
  givenName: text('given_name'),
  familyName: text('family_name'),
  birthday: text('birthday'),
  about: text('about'),
})

/**
 * Alternate spellings or aliases (`staff_alternative_name` table) for staff.
 *
 * **Key columns:**
 * - `staffId` — FK to {@link staff.malId}; cascade on delete.
 * - `name` — Alias string; unique per `(staffId, name)`.
 */
export const staffAlternativeName = sqliteTable(
  'staff_alternative_name',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    staffId: integer('staff_id')
      .notNull()
      .references(() => staff.malId, { onDelete: 'cascade' }),
    name: text('name').notNull(),
  },
  (t) => [uniqueIndex('staff_alt_name_unique').on(t.staffId, t.name)]
)
