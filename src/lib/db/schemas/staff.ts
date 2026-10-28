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
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'

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
export const staff = pgTable(
  'staff',
  {
    malId: integer('mal_id').primaryKey(),
    name: text('name').notNull(),
    givenName: text('given_name'),
    familyName: text('family_name'),
    birthday: text('birthday'),
    about: text('about'),
    /** AniList staff id, para cruzar con la fuente que da los créditos. */
    anilistId: integer('anilist_id'),
    /** `Male` / `Female` / `Non-binary` (AniList). */
    gender: text('gender'),
    dateOfBirth: timestamp('date_of_birth', { withTimezone: true }),
    /** Puestos como favorito en AniList. */
    favorites: integer('favorites'),
    /** Id de persona en AniList cuando el rol es de voz (distingue del actor). */
    voiceActorMalId: integer('voice_actor_mal_id'),
  },
  (t) => [index('staff_name_trgm_idx').using('gin', t.name.op('gin_trgm_ops'))]
)

/**
 * Alternate spellings or aliases (`staff_alternative_name` table) for staff.
 *
 * **Key columns:**
 * - `staffId` — FK to {@link staff.malId}; cascade on delete.
 * - `name` — Alias string; unique per `(staffId, name)`.
 */
export const staffAlternativeName = pgTable(
  'staff_alternative_name',
  {
    id: serial('id').primaryKey(),
    staffId: integer('staff_id')
      .notNull()
      .references(() => staff.malId, { onDelete: 'cascade' }),
    name: text('name').notNull(),
  },
  (t) => [uniqueIndex('staff_alt_name_unique').on(t.staffId, t.name)]
)
