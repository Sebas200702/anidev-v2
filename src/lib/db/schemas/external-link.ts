/**
 * @module lib/db/schemas/external-link
 *
 * Official sites, wikis and social profiles linked from a catalog entry.
 *
 * @remarks
 * Two parallel tables (`anime_external_link` and `manga_external_link`) rather
 * than one polymorphic table: every link keeps a real foreign key, so deleting
 * a work removes its links and the catalogue cannot hold orphans.
 *
 * @see {@link module:lib/db/schemas/anime} for the anime root
 * @see {@link module:lib/db/schemas/manga} for the printed-media root
 */
import {
  index,
  integer,
  pgTable,
  serial,
  text,
  uniqueIndex,
} from 'drizzle-orm/pg-core'

import { anime } from '@db/schemas/anime'
import { manga } from '@db/schemas/manga'

/** External link of an anime (`anime_external_link` table). */
export const animeExternalLink = pgTable(
  'anime_external_link',
  {
    id: serial('id').primaryKey(),
    animeId: integer('anime_id')
      .notNull()
      .references(() => anime.malId, { onDelete: 'cascade' }),
    site: text('site').notNull(),
    url: text('url').notNull(),
    type: text('type'),
    icon: text('icon'),
  },
  (t) => [
    uniqueIndex('anime_external_link_anime_id_url_unique').on(t.animeId, t.url),
    index('anime_external_link_site_idx').on(t.site),
  ]
)

/** External link of a printed work (`manga_external_link` table). */
export const mangaExternalLink = pgTable(
  'manga_external_link',
  {
    id: serial('id').primaryKey(),
    mangaId: integer('manga_id')
      .notNull()
      .references(() => manga.malId, { onDelete: 'cascade' }),
    site: text('site').notNull(),
    url: text('url').notNull(),
    type: text('type'),
    icon: text('icon'),
  },
  (t) => [
    uniqueIndex('manga_external_link_manga_id_url_unique').on(t.mangaId, t.url),
    index('manga_external_link_site_idx').on(t.site),
  ]
)
