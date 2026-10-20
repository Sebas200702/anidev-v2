/**
 * @module lib/db/schemas/manga-media
 *
 * Image assets attached to printed-media records (cover, banner, and the
 * variant labels used by the media pipeline).
 *
 * @see {@link module:lib/db/schemas/anime-media} for the anime counterpart
 * @see {@link module:lib/db/schemas/manga} for parent printed-media row
 */
import {
  index,
  integer,
  pgTable,
  serial,
  text,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { manga } from '@db/schemas/manga'

/**
 * Image and media URLs (`manga_media` table) associated with a work.
 *
 * **Key columns:**
 * - `mangaId` — FK to {@link manga.malId}; cascade on delete.
 * - `mediaType` — Asset category (cover, banner, …); required.
 * - `src` — URL or path to the media resource; required.
 * - `source` — Provenance of the asset (mal, anilist, kitsu…).
 * - `priority` — Preference order when several variants share a `mediaType`.
 */
export const mangaMedia = pgTable(
  'manga_media',
  {
    id: serial('id').primaryKey(),
    mangaId: integer('manga_id')
      .notNull()
      .references(() => manga.malId, { onDelete: 'cascade' }),
    mediaType: text('media_type').notNull(),
    src: text('src').notNull(),
    size: text('size'),
    source: text('source'),
    priority: integer('priority').notNull().default(100),
  },
  (t) => [
    index('manga_media_manga_id_type_priority_idx').on(
      t.mangaId,
      t.mediaType,
      t.priority
    ),
    uniqueIndex('manga_media_entity_type_src_unique').on(
      t.mangaId,
      t.mediaType,
      t.src
    ),
  ]
)
