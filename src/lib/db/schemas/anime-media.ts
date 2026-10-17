/**
 * @module lib/db/schemas/anime-media
 *
 * Image and media asset URLs attached to anime catalog records. Supports
 * multiple assets per anime with type and size metadata for responsive UI.
 *
 * @remarks
 * `mediaType` and `size` are free-text labels aligned with upstream import
 * conventions (e.g. poster, fanart, small/large). URLs are stored as absolute
 * or CDN paths in `src`.
 *
 * @see {@link module:lib/db/schemas/anime} for parent anime entity
 */
import { index, integer, pgTable, serial, text, uniqueIndex } from 'drizzle-orm/pg-core'
import { anime } from '@db/schemas/anime'

/**
 * Image and media URLs (`anime_media` table) associated with an anime record.
 *
 * **Key columns:**
 * - `animeId` — FK to {@link anime.malId}; cascade on delete.
 * - `mediaType` — Asset category (poster, banner, etc.); required.
 * - `src` — URL or path to the media resource; required.
 * - `size` — Optional variant label (e.g. `large`, `webp`).
 *
 * @see {@link anime} parent anime row
 */
export const animeMedia = pgTable(
  'anime_media',
  {
    id: serial('id').primaryKey(),
    animeId: integer('anime_id')
      .notNull()
      .references(() => anime.malId, { onDelete: 'cascade' }),
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
    index('anime_media_anime_id_type_priority_idx').on(t.animeId, t.mediaType, t.priority),
    // Identidad natural: una fila por (entidad, tipo, url); las variantes
    // conviven porque cambia `src`. Da un target valido a ON CONFLICT.
    uniqueIndex('anime_media_entity_type_src_unique').on(t.animeId, t.mediaType, t.src),
  ]
)
