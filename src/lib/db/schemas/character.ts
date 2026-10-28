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
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'

/**
 * Character profile (`character` table) keyed by MyAnimeList ID.
 *
 * **Key columns:**
 * - `malId` — Primary key; MAL character id.
 * - `name` — Primary display name (required).
 * - `nameKanji` — Optional Japanese script name.
 * - `about` — Biography or description text.
 */
export const character = pgTable(
  'character',
  {
    malId: integer('mal_id').primaryKey(),
    name: text('name').notNull(),
    nameKanji: text('name_kanji'),
    about: text('about'),
    /** AniList character id, para cruzar con la fuente que da el reparto. */
    anilistId: integer('anilist_id'),
    /** `Male` / `Female` / `Non-binary` (AniList). */
    gender: text('gender'),
    dateOfBirth: timestamp('date_of_birth', { withTimezone: true }),
    bloodType: text('blood_type'),
    /** Altura en cm y peso en kg (AniList). */
    height: integer('height'),
    weight: integer('weight'),
    /** Edad declarada en la ficha de AniList (texto: "17", "23-25"). */
    age: text('age'),
    /** Puestos como favorito en AniList (mide popularidad del personaje). */
    favorites: integer('favorites'),
  },
  (t) => [
    index('character_name_trgm_idx').using('gin', t.name.op('gin_trgm_ops')),
    index('character_name_kanji_trgm_idx').using(
      'gin',
      t.nameKanji.op('gin_trgm_ops')
    ),
  ]
)

/**
 * Alternate nicknames (`character_nickname` table) for a character.
 *
 * **Key columns:**
 * - `characterId` — FK to {@link character.malId}; cascade on delete.
 * - `nickname` — Alias string; unique per `(characterId, nickname)`.
 */
export const characterNickname = pgTable(
  'character_nickname',
  {
    id: serial('id').primaryKey(),
    characterId: integer('character_id')
      .notNull()
      .references(() => character.malId, { onDelete: 'cascade' }),
    nickname: text('nickname').notNull(),
  },
  (t) => [
    uniqueIndex('character_nickname_unique').on(t.characterId, t.nickname),
  ]
)
