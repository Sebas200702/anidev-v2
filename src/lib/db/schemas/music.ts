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
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core'

/**
 * Base music track record (`music` table).
 *
 * **Key columns:**
 * - `id` — Primary key; stable music catalog id from import source.
 * - `title` — Track title (nullable for incomplete imports).
 * - `type` — Track category (OP, ED, Insert, etc.); required.
 */
export const music = sqliteTable('music', {
  id: integer('id').primaryKey(),
  title: text('title'),
  type: text('type').notNull(),
})

/**
 * Versioned variant (`music_version` table) of a music track.
 *
 * **Key columns:**
 * - `musicId` — FK to {@link music.id}; cascade on delete.
 * - `version` / `versionId` — Version index and external version identifier.
 * - Unique on `(musicId, versionId)`.
 */
export const musicVersion = sqliteTable(
  'music_version',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    musicId: integer('music_id')
      .notNull()
      .references(() => music.id, { onDelete: 'cascade' }),
    version: integer('version').notNull(),
    versionId: integer('version_id').notNull(),
  },
  (t) => [uniqueIndex('music_version_unique').on(t.musicId, t.versionId)]
)

/**
 * Streamable resolution assets (`music_resolution` table) for a music version.
 *
 * **Key columns:**
 * - `musicVersionId` — FK to {@link musicVersion.versionId} (not surrogate id).
 * - `songId` — External song identifier from media provider.
 * - `resolution` — Quality label (720p, 1080p, audio-only, etc.).
 * - `audioUrl` / `videoUrl` — Optional stream URLs for playback.
 */
export const musicResolution = sqliteTable(
  'music_resolution',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
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
