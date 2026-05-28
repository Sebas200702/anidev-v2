/**
 * @module lib/db/schemas/character
 *
 * Character entity tables: core profile fields keyed by MyAnimeList ID and
 * nickname aliases for search matching and display variants.
 *
 * @remarks
 * Characters link to anime via {@link module:lib/db/schemas/anime-relations.animeCharacter}
 * and to voice actors via {@link module:lib/db/schemas/character-relations}.
 * Nicknames cascade-delete with the parent character.
 *
 * @see {@link module:lib/db/schemas/character-media} for character images
 * @see {@link module:lib/db/schemas/character-relations} for voice actor links
 */
import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core'

/**
 * Character profile (`character` table) keyed by MyAnimeList ID.
 *
 * **Key columns:**
 * - `malId` — Primary key; MAL character id.
 * - `name` — Primary display name (required).
 * - `nameKanji` — Optional Japanese script name.
 * - `about` — Biography or description text.
 */
export const character = sqliteTable('character', {
  malId: integer('mal_id').primaryKey(),
  name: text('name').notNull(),
  nameKanji: text('name_kanji'),
  about: text('about'),
})

/**
 * Alternate nicknames (`character_nickname` table) for a character.
 *
 * **Key columns:**
 * - `characterId` — FK to {@link character.malId}; cascade on delete.
 * - `nickname` — Alias string; unique per `(characterId, nickname)`.
 */
export const characterNickname = sqliteTable(
  'character_nickname',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    characterId: integer('character_id')
      .notNull()
      .references(() => character.malId, { onDelete: 'cascade' }),
    nickname: text('nickname').notNull(),
  },
  (t) => [
    uniqueIndex('character_nickname_unique').on(t.characterId, t.nickname),
  ]
)
