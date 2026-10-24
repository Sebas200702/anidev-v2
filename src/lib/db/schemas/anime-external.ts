/**
 * @module lib/db/schemas/anime-external
 *
 * Cross-platform external identifiers for anime entries, enabling deep links
 * and sync with AnimeThemes, Kitsu, TVDB, and other metadata services.
 *
 * @remarks
 * One row per anime (`animeId` primary key). Nullable external IDs reflect
 * availability from import sources. Timestamps track last sync for incremental
 * updates.
 *
 * @see {@link module:lib/db/schemas/anime} for parent MAL-keyed anime row
 */
import { integer, text, pgTable, timestamp } from 'drizzle-orm/pg-core'

import { anime } from '@db/schemas/anime'

/**
 * Cross-service IDs and slugs (`anime_external_ids` table) for a single anime.
 *
 * **Key columns:**
 * - `animeId` — Primary key and FK to {@link anime.malId}.
 * - `animeThemesSlug` — Slug on AnimeThemes.net when known.
 * - `kitsuId` / `tvdbId` — Numeric external catalog identifiers.
 * - `anilistId` — AniList numeric media id (sembrado del dump offline).
 * - `annId` — Anime News Network encyclopedia id (sembrado del dump offline):
 *   la enciclopedia de ANN publica los OP/ED con **nº de tema, artista y rango
 *   de episodios**, el dato que ni MAL ni AnimeThemes dan de forma completa.
 * - `tmdbId` — The Movie Database series id. Es la fuente más completa de
 *   **backdrops** (banner) y de **stills** (miniatura de episodio con su
 *   `episode_number`, que es la numeración estándar).
 * - `createdAt` / `updatedAt` — Row lifecycle timestamps (JS `Date` mode).
 *
 * @see {@link anime} canonical anime record
 */
export const animeExternalIds = pgTable('anime_external_ids', {
  animeId: integer('anime_id')
    .notNull()
    .primaryKey()
    .references(() => anime.malId),

  animeThemesSlug: text('anime_themes_slug'),
  kitsuId: integer('kitsu_id'),
  tvdbId: integer('tvdb_id'),
  anilistId: integer('anilist_id'),
  annId: integer('ann_id'),
  tmdbId: integer('tmdb_id'),

  createdAt: timestamp('created_at')
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: timestamp('updated_at')
    .notNull()
    .$defaultFn(() => new Date()),
})
