/**
 * @module lib/db/schemas/music-media
 *
 * Cover art and related visual media attached to music catalog entries.
 * Uses the shared media column pattern (`mediaType`, `src`, `size`).
 *
 * @remarks
 * Cascade-deletes when parent music row is removed. Multiple assets per track
 * are supported for thumbnails, full covers, and alternate art.
 *
 * @see {@link module:lib/db/schemas/music} for parent music entity
 */
import {
  index,
  integer,
  pgTable,
  serial,
  text,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { music } from '@db/schemas/music'

/**
 * Cover art and related media (`music_media` table) linked to a music track.
 *
 * **Key columns:**
 * - `musicId` — FK to {@link music.id}; cascade on delete.
 * - `mediaType` — Asset type label (cover, thumbnail, etc.).
 * - `src` — Image URL or CDN path.
 * - `size` — Optional variant (small, large).
 */
export const musicMedia = pgTable(
  'music_media',
  {
    id: serial('id').primaryKey(),
    musicId: integer('music_id')
      .notNull()
      .references(() => music.id, { onDelete: 'cascade' }),
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
    index('music_media_music_id_type_priority_idx').on(
      t.musicId,
      t.mediaType,
      t.priority
    ),
    // Identidad natural: una fila por (entidad, tipo, url); las variantes
    // conviven porque cambia `src`. Da un target valido a ON CONFLICT.
    uniqueIndex('music_media_entity_type_src_unique').on(
      t.musicId,
      t.mediaType,
      t.src
    ),
  ]
)
