/**
 * @module lib/db/schemas/music
 *
 * Music catalog schema: base tracks, versioned variants, and streamable
 * resolution assets (audio/video URLs). Supports multi-version OP/ED imports
 * with per-resolution media links.
 *
 * @remarks
 * `musicVersion.versionId` is referenced by {@link musicResolution} (not the
 * surrogate `musicVersion.id`). Unique indexes prevent duplicate version and
 * resolution rows during bulk import.
 *
 * @see {@link module:lib/db/schemas/music-media} for cover art
 * @see {@link module:lib/db/schemas/music-relations} for artist credits
 * @see {@link module:lib/db/schemas/anime-relations.animeMusic} for anime links
 */
import {
  integer,
  pgTable,
  serial,
  text,
  uniqueIndex,
} from 'drizzle-orm/pg-core'

/**
 * Base music track record (`music` table).
 *
 * **Key columns:**
 * - `id` — Primary key; stable music catalog id from import source.
 * - `title` — Track title (nullable for incomplete imports).
 * - `type` — Track category (OP, ED, Insert, etc.); required.
 */
export const music = pgTable('music', {
  id: integer('id').primaryKey().notNull(),
  title: text('title'),
  type: text('type').notNull(),
})

/**
 * Versioned variant (`music_version` table) of a music track.
 *
 * **Key columns:**
 * - `musicId` — FK to {@link music.id}; cascade on delete.
 * - `version` / `versionId` — Version index and external version identifier.
 * - `versionId` unique — the external catalog id is the version's identity and
 *   is referenced by {@link musicResolution}; Postgres requires it be unique.
 */
export const musicVersion = pgTable('music_version', {
  id: serial('id').primaryKey(),
  musicId: integer('music_id')
    .notNull()
    .references(() => music.id, { onDelete: 'cascade' }),
  version: integer('version').notNull(),
  versionId: integer('version_id').notNull().unique(),
})

/**
 * Streamable resolution assets (`music_resolution` table) for a music version.
 *
 * **Key columns:**
 * - `musicVersionId` — FK to {@link musicVersion.versionId} (not surrogate id).
 * - `songId` — External song identifier from media provider.
 * - `resolution` — Quality label (720p, 1080p, audio-only, etc.).
 * - `audioUrl` / `videoUrl` — Optional stream URLs for playback.
 */
export const musicResolution = pgTable(
  'music_resolution',
  {
    id: serial('id').primaryKey(),
    musicVersionId: integer('music_version_id')
      .notNull()
      .references(() => musicVersion.versionId, { onDelete: 'cascade' }),
    songId: integer('song_id').notNull(),
    resolution: text('resolution').notNull(),
    audioUrl: text('audio_url'),
    videoUrl: text('video_url'),
  },
  (t) => [
    uniqueIndex('music_resolution_song_res_unique').on(t.songId, t.resolution),
  ]
)
