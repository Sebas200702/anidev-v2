import { music } from '@/core/db/schemas/music'
import { artist } from '@/core/db/schemas/artist'
import { sqliteTable, integer, primaryKey } from 'drizzle-orm/sqlite-core'

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
