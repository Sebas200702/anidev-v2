/**
 * @module lib/db/schemas/anime-entity-relations
 *
 * Junction tables linking anime to entities: staff, music, characters, related anime, and
 * producers. Composite primary keys prevent duplicate links while allowing multiple roles
 * (e.g. same staff with different `role` strings on {@link animeStaff}).
 *
 * @see {@link module:lib/db/schemas/character} for character entities
 * @see {@link module:lib/db/schemas/staff} for staff entities
 * @see {@link module:lib/db/schemas/anime-relations} for the aggregating re-export
 */
import { anime } from '@db/schemas/anime'
import { music } from '@db/schemas/music'
import { character } from '@db/schemas/character'
import { producer } from '@db/schemas/producer'
import { staff } from '@db/schemas/staff'

import { integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core'

/**
 * Staff credits (`anime_staff` table) attached to an anime with role metadata.
 *
 * **Key columns:**
 * - `animeId`, `staffId`, `role` — composite PK; allows duplicate staff with different roles.
 * - `role` — Free-text credit (Director, Series Composition, etc.).
 */
export const animeStaff = sqliteTable(
  'anime_staff',
  {
    animeId: integer('anime_id')
      .notNull()
      .references(() => anime.malId, { onDelete: 'cascade' }),
    staffId: integer('staff_id')
      .notNull()
      .references(() => staff.malId, { onDelete: 'cascade' }),
    role: text('role').notNull(),
  },
  (t) => [primaryKey({ columns: [t.animeId, t.staffId, t.role] })]
)

/**
 * Theme or soundtrack track links (`anime_music` table) between anime and music.
 *
 * **Key columns:** `animeId`, `musicId` — composite primary key.
 */
export const animeMusic = sqliteTable(
  'anime_music',
  {
    animeId: integer('anime_id')
      .references(() => anime.malId)
      .notNull(),
    musicId: integer('music_id')
      .references(() => music.id)
      .notNull(),
  },
  (t) => [primaryKey({ columns: [t.animeId, t.musicId] })]
)

/**
 * Character appearances (`anime_character` table) on an anime with role metadata.
 *
 * **Key columns:**
 * - `animeId`, `characterId`, `role` — composite PK.
 * - `role` — Main, Supporting, etc.
 */
export const animeCharacter = sqliteTable(
  'anime_character',
  {
    animeId: integer('anime_id')
      .notNull()
      .references(() => anime.malId, { onDelete: 'cascade' }),
    characterId: integer('character_id')
      .notNull()
      .references(() => character.malId, { onDelete: 'cascade' }),
    role: text('role').notNull(),
  },
  (t) => [primaryKey({ columns: [t.animeId, t.characterId, t.role] })]
)

/**
 * Related anime entries (`anime_relation` table) with relation type metadata.
 *
 * **Key columns:**
 * - `animeId`, `relatedAnimeId`, `relationType` — composite PK.
 * - `relationType` — Sequel, Prequel, Side story, etc.
 */
export const animeRelatedAnime = sqliteTable(
  'anime_relation',
  {
    animeId: integer('anime_id')
      .references(() => anime.malId)
      .notNull(),
    relationType: text('relation_type').notNull(),
    relatedAnimeId: integer('related_anime_id')
      .references(() => anime.malId)
      .notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.animeId, t.relatedAnimeId, t.relationType] }),
  ]
)

/**
 * Production company links (`anime_producer` table) between anime and producers.
 *
 * **Key columns:** `animeId`, `producerId` — composite primary key.
 */
export const animeProducer = sqliteTable(
  'anime_producer',
  {
    animeId: integer('anime_id')
      .notNull()
      .references(() => anime.malId, { onDelete: 'cascade' }),
    producerId: integer('producer_id')
      .notNull()
      .references(() => producer.malId, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.animeId, t.producerId] })]
)
