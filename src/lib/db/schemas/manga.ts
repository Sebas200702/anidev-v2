/**
 * @module lib/db/schemas/manga
 *
 * Printed-media catalog root: manga, novels, one-shots, doujinshi, manhwa and
 * manhua all live in the same table, discriminated by `type`. It mirrors the
 * shape of {@link module:lib/db/schemas/anime} so the discovery queries,
 * taxonomy and media pipeline can be reused with a single flag.
 *
 * @remarks
 * The `malId` primary key is the MyAnimeList id, which is also the id space of
 * the `manga`, `novel` and `one_shot` endpoints of the MAL API v2. AniList ids
 * live in {@link module:lib/db/schemas/manga-external}.malExternalIds.
 *
 * @see {@link module:lib/db/schemas/manga-relations} for manga ↔ entity links
 * @see {@link module:lib/db/schemas/manga-media} for cover and banner assets
 * @see {@link module:lib/db/schemas/anime} for the anime counterpart
 */
import {
  index,
  integer,
  pgTable,
  real,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'

/**
 * Printed media root (`manga` table) keyed by MyAnimeList id.
 *
 * **Key columns:**
 * - `malId` — Primary key; MAL manga/novel id.
 * - `type` — `manga`, `novel`, `one_shot`, `doujin`, `manhwa` or `manhua`.
 * - `chapters` / `volumes` — Length of the work as published.
 * - `publishedFrom` / `publishedTo` — Publication window.
 * - `serialization` — Magazine/label serialisation as published by MAL.
 */
export const manga = pgTable(
  'manga',
  {
    malId: integer('mal_id').primaryKey().notNull(),
    type: text('type').notNull().default('manga'),
    title: text('title').notNull(),
    titleEnglish: text('title_english'),
    titleJapanese: text('title_japanese'),
    status: text('status'),
    chapters: integer('chapters'),
    volumes: integer('volumes'),
    score: real('score'),
    scoredBy: integer('scored_by'),
    popularityRank: integer('popularity_rank'),
    ranking: integer('ranking'),
    members: integer('members'),
    favorites: integer('favorites'),
    year: integer('year'),
    synopsis: text('synopsis'),
    background: text('background'),
    source: text('source'),
    serialization: text('serialization'),
    countryOfOrigin: text('country_of_origin'),
    duration: text('duration'),
    publishedFrom: timestamp('published_from', { withTimezone: true }),
    publishedTo: timestamp('published_to', { withTimezone: true }),
  },
  (t) => [
    index('manga_year_idx').on(t.year),
    index('manga_type_idx').on(t.type),
    index('manga_score_idx').on(t.score),
    index('manga_status_idx').on(t.status),
    index('manga_title_trgm_idx').using('gin', t.title.op('gin_trgm_ops')),
    index('manga_title_english_trgm_idx').using(
      'gin',
      t.titleEnglish.op('gin_trgm_ops')
    ),
    index('manga_title_japanese_trgm_idx').using(
      'gin',
      t.titleJapanese.op('gin_trgm_ops')
    ),
  ]
)

/**
 * Alternate titles (`manga_title_synonym` table) for a printed-media record.
 *
 * **Key columns:**
 * - `mangaId` — FK to {@link manga.malId}; cascade on delete.
 * - `title` — Alias string; unique per `(mangaId, title)`.
 */
export const mangaTitleSynonym = pgTable(
  'manga_title_synonym',
  {
    id: serial('id').primaryKey(),
    mangaId: integer('manga_id')
      .notNull()
      .references(() => manga.malId, { onDelete: 'cascade' }),
    title: text('title').notNull(),
  },
  (t) => [
    uniqueIndex('manga_title_synonym_manga_id_title_idx').on(
      t.mangaId,
      t.title
    ),
    index('manga_title_synonym_title_trgm_idx').using(
      'gin',
      t.title.op('gin_trgm_ops')
    ),
  ]
)
