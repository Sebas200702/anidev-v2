/**
 * @module lib/db/schemas/music-stream
 *
 * External store links per music track (`music_stream` table).
 *
 * @remarks MAL publishes, for every opening/ending, the links to the licensed
 * streaming stores (Spotify, Apple Music, Amazon Music) plus the track id inside
 * each store. Those ids are what the ingestion pipeline uses to locate the full
 * audio later (a preview-only API is not enough), so they are catalogued here
 * instead of being thrown away with the scraped page.
 *
 * One row per `(music_id, provider)`: the same track is normally listed once per
 * store.
 *
 * @see {@link module:lib/db/schemas/music} for the parent track
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
 * Store link of a music track (`music_stream` table).
 *
 * **Key columns:**
 * - `musicId` — FK to {@link music.id}; cascade on delete.
 * - `provider` — Store slug (`spotify`, `apple`, `amazon`, …).
 * - `url` — Public track page in that store.
 * - `externalId` — Track id inside the store (Spotify base62 id, Apple `i`
 *   query param, …). Nullable when the store link carries no id.
 * - `country` — Storefront the link belongs to (`jp`, `us`), when the URL
 *   encodes one.
 */
export const musicStream = pgTable(
  'music_stream',
  {
    id: serial('id').primaryKey(),
    musicId: integer('music_id')
      .notNull()
      .references(() => music.id, { onDelete: 'cascade' }),
    provider: text('provider').notNull(),
    url: text('url').notNull(),
    externalId: text('external_id'),
    country: text('country'),
  },
  (t) => [
    uniqueIndex('music_stream_music_provider_unique').on(t.musicId, t.provider),
    index('music_stream_music_id_idx').on(t.musicId),
  ]
)
