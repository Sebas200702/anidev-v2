/**
 * @module lib/db/schemas/user-media
 *
 * Relational per-user state for anime lists and watch progress.
 *
 * @remarks
 * `userAnimeList` replaces the serialized `profile.favorite_animes` CSV with a
 * typed row per (user, anime). `watchProgress` stores the latest playback
 * position collapsed to one row per (user, anime) so the *Continue Watching*
 * rail can be served without scanning history.
 *
 * @see {@link module:lib/db/schemas/auth-schema.user}
 * @see {@link module:lib/db/schemas/anime}
 * @see {@link module:lib/db/schemas/episode}
 */
import {
  boolean,
  index,
  integer,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'
import { user } from '@db/schemas/auth-schema'
import { anime } from '@db/schemas/anime'
import { episode } from '@db/schemas/episode'

/**
 * Per-user anime list entries (`user_anime_list` table).
 *
 * **Key columns:**
 * - `userId` — FK to {@link user.id}; cascade on delete.
 * - `animeId` — FK to {@link anime.malId}; cascade on delete.
 * - `status` — `watching`, `completed`, `plan_to_watch`, `on_hold`, `dropped`.
 * - `isFavorite` — Whether the title is favorited.
 * - `score` — User score (1–10), nullable.
 * - `addedAt` / `updatedAt` — Audit timestamps.
 */
export const userAnimeList = pgTable(
  'user_anime_list',
  {
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    animeId: integer('anime_id')
      .notNull()
      .references(() => anime.malId, { onDelete: 'cascade' }),
    status: text('status').notNull().default('plan_to_watch'),
    isFavorite: boolean('is_favorite').notNull().default(false),
    score: real('score'),
    addedAt: timestamp('added_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.animeId] }),
    index('user_anime_list_user_id_idx').on(t.userId),
    index('user_anime_list_anime_id_idx').on(t.animeId),
    index('user_anime_list_status_idx').on(t.status),
  ]
)

/**
 * Per-user, per-anime watch progress (`watch_progress` table).
 *
 * **Key columns:**
 * - `userId` — FK to {@link user.id}; cascade on delete.
 * - `animeId` — FK to {@link anime.malId}; cascade on delete.
 * - `episodeId` — FK to {@link episode.id}; cascade on delete (nullable).
 * - `progressSeconds` — Playback position in seconds.
 * - `durationSeconds` — Episode duration in seconds (nullable).
 * - `completed` — Whether the episode/anime is completed.
 * - `updatedAt` — Last progress update.
 */
export const watchProgress = pgTable(
  'watch_progress',
  {
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    animeId: integer('anime_id')
      .notNull()
      .references(() => anime.malId, { onDelete: 'cascade' }),
    episodeId: integer('episode_id')
      .notNull()
      .references(() => episode.id, { onDelete: 'cascade' }),
    episodeNumber: integer('episode_number').notNull(),
    progressSeconds: integer('progress_seconds').notNull().default(0),
    durationSeconds: integer('duration_seconds'),
    completed: boolean('completed').notNull().default(false),
    watchedAt: timestamp('watched_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.episodeId] }),
    index('watch_progress_user_id_idx').on(t.userId),
    index('watch_progress_anime_id_idx').on(t.animeId),
    index('watch_progress_episode_id_idx').on(t.episodeId),
    index('watch_progress_watched_at_idx').on(t.watchedAt),
    index('watch_progress_updated_at_idx').on(t.updatedAt),
  ]
)
