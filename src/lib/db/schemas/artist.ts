/**
 * @module lib/db/schemas/artist
 *
 * Music artist catalog with optional cross-reference to staff profiles when
 * the performer also exists in the MAL staff database (e.g. voice actors who
 * also perform theme songs).
 *
 * @remarks
 * Artist names are unique (`artist_name_unique`). `malId` is optional and links
 * to {@link module:lib/db/schemas/staff} when the artist maps to a staff row.
 *
 * @see {@link module:lib/db/schemas/music-relations} for music ↔ artist credits
 * @see {@link module:lib/db/schemas/staff} for optional staff linkage
 */
import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core'
import { staff } from '@db/schemas/staff'

/**
 * Music artist record (`artist` table) with optional staff cross-reference.
 *
 * **Key columns:**
 * - `id` — Surrogate primary key (auto-increment).
 * - `name` — Display name; globally unique.
 * - `malId` — Optional FK to {@link staff.malId} when artist maps to staff.
 */
export const artist = sqliteTable(
  'artist',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),

    name: text('name').notNull(),

    malId: integer('mal_id').references(() => staff.malId),
  },
  (t) => [uniqueIndex('artist_name_unique').on(t.name)]
)
