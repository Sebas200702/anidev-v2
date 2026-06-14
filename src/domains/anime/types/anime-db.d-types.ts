/**
 * Database row types inferred from Drizzle schemas for the anime domain.
 *
 * @module domains/anime/types/anime-db
 * @remarks
 * All types use `InferSelectModel` — they represent **read** row shapes from Postgres. Join/relation
 * table row types live in {@link module:domains/anime/types/anime-relations-db} and are re-exported
 * here so existing `@domains/anime/types/anime-db.d-types` imports keep working.
 */
import type { InferSelectModel } from 'drizzle-orm'
import { anime, animeTitleSynonym } from '@db/schemas/anime'
import { animeExternalIds } from '@db/schemas/anime-external'
import { character, characterNickname } from '@db/schemas/character'
import { producer } from '@db/schemas/producer'
import { staff } from '@db/schemas/staff'
import { genre, theme, demographic } from '@db/schemas/anime-taxonomy'

// AnimeRelationsDB, AnimeCharacterDB, and other relation types are re-exported
// via the barrel at `@domains/anime/types`. Import them from there or from
// `@domains/anime/types/anime-relations.d-types` directly.

/**
 * Row shape for the `anime` table.
 *
 * @remarks
 * **Key fields:** `malId` (PK), `title`, `titleEnglish`, `titleJapanese`, `year`,
 * `status`, `score`, `synopsis`, `type`, `episodes`, `rating`, `season`.
 *
 * @see {@link animeRepository}
 */
export type AnimeDB = InferSelectModel<typeof anime>

/**
 * Row shape for the `anime_title_synonym` table.
 *
 * @remarks
 * **Relationships:** `animeId` → `anime.mal_id`
 *
 * @see {@link animeTitleRepository}
 */
export type AnimeTitleSynonymDB = InferSelectModel<typeof animeTitleSynonym>

/**
 * Row shape for the `anime_external_ids` table.
 *
 * @remarks
 * **Key fields:** `animeId`, `kitsuId`, `tvdbId`, `animeThemesSlug`
 *
 * @see {@link animeExternalRepository}
 * @see {@link mapExternalIds}
 */
export type AnimeExternalDB = InferSelectModel<typeof animeExternalIds>

/**
 * Row shape for the `character` table.
 *
 * @see {@link characterRepository}
 */
export type CharacterDB = InferSelectModel<typeof character>

/**
 * Row shape for the `character_nickname` table.
 */
export type CharacterNicknameDB = InferSelectModel<typeof characterNickname>

/**
 * Row shape for the `producer` table.
 */
export type ProducerDB = InferSelectModel<typeof producer>

/**
 * Row shape for the `staff` table (people: creators and voice actors).
 *
 * @see {@link staffRepository}
 */
export type StaffDB = InferSelectModel<typeof staff>

/**
 * Row shape for the `genre` taxonomy table.
 *
 * @see {@link animeTaxonomyRepository.getGenresByAnimeId}
 */
export type GenreDB = InferSelectModel<typeof genre>

/**
 * Row shape for the `theme` taxonomy table.
 */
export type ThemeDB = InferSelectModel<typeof theme>

/**
 * Row shape for the `demographic` taxonomy table.
 */
export type DemographicDB = InferSelectModel<typeof demographic>
