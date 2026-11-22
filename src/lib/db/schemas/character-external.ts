/**
 * @module lib/db/schemas/character-external
 *
 * Cross-platform external identifiers for characters (MyAnimeList, AniList,
 * AniDB), so the internal character key no longer has to encode its source.
 *
 * @remarks
 * One row per character (`characterId` primary key). Mirrors
 * {@link module:lib/db/schemas/anime-external}: every external id is nullable;
 * `malId` and `anilistId` are unique when present (partial unique indexes
 * `WHERE ... IS NOT NULL`).
 * Replaces the `1000000000 + AniList id` synthetic-key trick and the
 * deprecated `character.anilist_id` column. Rows are backfilled and twins are
 * merged by `scripts/db/character-external/`.
 *
 * @see {@link module:lib/db/schemas/character} for the internal character key
 */
import { sql } from 'drizzle-orm'
import { integer, pgTable, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'

import { character } from '@db/schemas/character'

/**
 * External ids (`character_external` table) for a single character.
 *
 * **Key columns:**
 * - `characterId` — Primary key and FK to {@link character.malId} (the
 *   internal character key); cascades on delete.
 * - `malId` — MyAnimeList character id; `NULL` for AniList-only characters.
 * - `anilistId` — AniList character id; `NULL` when unknown or when several
 *   characters claim the same AniList id (logged as a conflict).
 * - `anidbId` — AniDB character id when known (not unique-indexed).
 * - `createdAt` / `updatedAt` — Row lifecycle timestamps (JS `Date` mode).
 *
 * @example
 * ```ts
 * db.select().from(characterExternal)
 *   .where(eq(characterExternal.anilistId, 36309))
 * ```
 */
export const characterExternal = pgTable(
  'character_external',
  {
    characterId: integer('character_id')
      .notNull()
      .primaryKey()
      .references(() => character.malId, { onDelete: 'cascade' }),

    malId: integer('mal_id'),
    anilistId: integer('anilist_id'),
    anidbId: integer('anidb_id'),

    createdAt: timestamp('created_at')
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: timestamp('updated_at')
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [
    uniqueIndex('character_external_mal_id_unique')
      .on(t.malId)
      .where(sql`${t.malId} IS NOT NULL`),
    uniqueIndex('character_external_anilist_id_unique')
      .on(t.anilistId)
      .where(sql`${t.anilistId} IS NOT NULL`),
  ]
)
