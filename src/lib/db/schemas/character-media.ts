/**
 * @module lib/db/schemas/character-media
 *
 * Image and media asset URLs attached to character records. Mirrors the anime
 * media pattern with type and size metadata for gallery and avatar rendering.
 *
 * @remarks
 * Multiple rows per character are allowed (different `mediaType` / `size`).
 * Cascade-delete when parent character is removed.
 *
 * @see {@link module:lib/db/schemas/character} for parent character entity
 */
import {
  index,
  integer,
  pgTable,
  serial,
  text,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { character } from '@db/schemas/character'

/**
 * Image and media URLs (`character_media` table) associated with a character.
 *
 * **Key columns:**
 * - `characterId` — FK to {@link character.malId}; cascade on delete.
 * - `mediaType` — Asset category (image, voice sample, etc.).
 * - `src` — Resource URL or path.
 * - `size` — Optional variant descriptor.
 */
export const characterMedia = pgTable(
  'character_media',
  {
    id: serial('id').primaryKey(),
    characterId: integer('character_id')
      .notNull()
      .references(() => character.malId, { onDelete: 'cascade' }),
    mediaType: text('media_type').notNull(),
    src: text('src').notNull(),
    size: text('size'),
    /** Origen del asset (anilist, tvdb, jikan, animethemes…). */
    source: text('source'),
    /**
     * Orden de preferencia al elegir una variante del mismo `mediaType`
     * (menor = primero). AniList es la fuente primaria de banners ⇒ 10.
     */
    priority: integer('priority').notNull().default(100),
  },
  (t) => [
    index('character_media_character_id_type_priority_idx').on(
      t.characterId,
      t.mediaType,
      t.priority
    ),
    uniqueIndex('character_media_entity_type_src_unique').on(
      t.characterId,
      t.mediaType,
      t.src
    ),
  ]
)
