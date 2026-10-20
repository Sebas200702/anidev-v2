/**
 * Database row types inferred from Drizzle schemas for the printed-media
 * (manga) domain.
 *
 * @module domains/manga/types/manga-db
 * @remarks
 * All types use `InferSelectModel` — they represent **read** row shapes from
 * Postgres. Junction row types live in
 * {@link module:domains/manga/types/manga-relations.d-types}.
 */
import type { InferSelectModel } from 'drizzle-orm'
import type { manga, mangaTitleSynonym } from '@db/schemas/manga'
import type { mangaExternalIds } from '@db/schemas/manga-external'
import type { mangaMedia } from '@db/schemas/manga-media'
import type { mangaExternalLink } from '@db/schemas/external-link'

/**
 * Row shape for the `manga` table.
 *
 * @remarks
 * **Key fields:** `malId` (PK), `type` (manga/novel/one_shot/…), `title`,
 * `chapters`, `volumes`, `status`, `score`, `synopsis`, `serialization`,
 * `publishedFrom`/`publishedTo`.
 *
 * @see {@link mangaListRepository}
 */
export type MangaDB = InferSelectModel<typeof manga>

/**
 * Row shape for the `manga_title_synonym` table.
 *
 * @remarks
 * **Relationships:** `mangaId` → `manga.mal_id`
 */
export type MangaTitleSynonymDB = InferSelectModel<typeof mangaTitleSynonym>

/**
 * Row shape for the `manga_external_ids` table.
 *
 * @remarks
 * **Key fields:** `mangaId`, `anilistId`, `kitsuId`, `tvdbId`
 */
export type MangaExternalIdsDB = InferSelectModel<typeof mangaExternalIds>

/**
 * Row shape for the `manga_media` table.
 *
 * @remarks
 * **Key fields:** `mangaId`, `mediaType` (cover/banner), `src`, `size`,
 * `source`, `priority`
 */
export type MangaMediaDB = InferSelectModel<typeof mangaMedia>

/**
 * Row shape for the `manga_external_link` table.
 *
 * @remarks
 * **Key fields:** `mangaId`, `site`, `url`, `type`
 */
export type MangaExternalLinkDB = InferSelectModel<typeof mangaExternalLink>
