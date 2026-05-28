/**
 * @module lib/db/schemas/producer
 *
 * Anime production company (studio/producer) records and localized title
 * variants. Producers link to anime via
 * {@link module:lib/db/schemas/anime-relations.animeProducer}.
 *
 * @remarks
 * Producer primary key is MAL `malId`. Title variants support multiple naming
 * conventions (default, Japanese, etc.) via the `type` column on
 * {@link producerTitle}.
 *
 * @see {@link module:lib/db/schemas/producer-media} for logos and media
 * @see {@link module:lib/db/schemas/anime-relations.animeProducer} for anime credits
 */
import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core'

/**
 * Production company record (`producer` table) keyed by MyAnimeList ID.
 *
 * **Key columns:**
 * - `malId` — Primary key; MAL producer/studio id.
 * - `established` — Founding date or year as text from import.
 * - `about` — Company description.
 * - `count` — Optional count metadata from MAL (e.g. produced titles).
 */
export const producer = sqliteTable('producer', {
  malId: integer('mal_id').primaryKey(),
  established: text('established'),
  about: text('about'),
  count: integer('count'),
})

/**
 * Localized or alternate producer names (`producer_title` table).
 *
 * **Key columns:**
 * - `producerId` — FK to {@link producer.malId}; cascade on delete.
 * - `type` — Title variant kind (Default, Japanese, etc.).
 * - `title` — Display string; unique per `(producerId, title)`.
 */
export const producerTitle = sqliteTable(
  'producer_title',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    producerId: integer('producer_id')
      .notNull()
      .references(() => producer.malId, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    title: text('title').notNull(),
  },
  (table) => [
    uniqueIndex('producer_title_unique').on(table.producerId, table.title),
  ]
)
