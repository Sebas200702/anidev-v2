/**
 * @module lib/db/schemas/music-relations
 *
 * Association tables linking music tracks to contributing artists. Implements
 * a many-to-many credit graph between {@link module:lib/db/schemas/music} and
 * {@link module:lib/db/schemas/artist}.
 *
 * @remarks
 * Composite primary key `(musicId, artistId)` prevents duplicate credit rows.
 * Foreign keys reference stable catalog ids from import pipelines.
 *
 * @see {@link musicArtist} junction table
 * @see {@link module:lib/db/schemas/anime-relations.animeMusic} for anime ↔ music links
 */
import { music } from '@db/schemas/music'
import { artist } from '@db/schemas/artist'
import { sqliteTable, integer, primaryKey } from 'drizzle-orm/sqlite-core'

/**
 * Artist credits (`music_artist` table) linking a music track to artists.
 *
 * **Key columns:**
 * - `musicId` — FK to {@link music.id}.
 * - `artistId` — FK to {@link artist.id}.
 * - Composite primary key on both columns.
 */
export const musicArtist = sqliteTable(
  'music_artist',
  {
    musicId: integer('music_id')
      .references(() => music.id)
      .notNull(),
    artistId: integer('artist_id')
      .references(() => artist.id)
      .notNull(),
  },
  (t) => [primaryKey({ columns: [t.musicId, t.artistId] })]
)
