/**
 * Database row types inferred from Drizzle schemas for the anime domain.
 *
 * @module domains/anime/types/anime-db
 * @remarks
 * All types use `InferSelectModel` — they represent **read** row shapes from Postgres.
 */
import type { InferSelectModel } from 'drizzle-orm'
import { anime, animeTitleSynonym } from '@db/schemas/anime'
import { animeExternalIds } from '@db/schemas/anime-external'
import { animeTaxonomy } from '@db/schemas/anime-taxonomy'
import {
  animeRelatedAnime,
  animeCharacter,
  animeDemographic,
  animeGenre,
  animeMusic,
  animeProducer,
  animeStaff,
  animeTheme,
} from '@db/schemas/anime-relations'
import { characterVoiceActor } from '@db/schemas/character-relations'
import { character, characterNickname } from '@db/schemas/character'
import { producer } from '@db/schemas/producer'
import { staff } from '@db/schemas/staff'
import { genre, theme, demographic } from '@db/schemas/anime-taxonomy'

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
 * Row shape for the `anime_taxonomy` table (legacy/auxiliary taxonomy storage).
 */
export type AnimeTaxonomyDB = InferSelectModel<typeof animeTaxonomy>

/**
 * Row shape for the `anime_related_anime` join table.
 *
 * @remarks
 * **Relationships:** `animeId` (source), `relatedAnimeId`, `relationType` (sequel, prequel, …)
 *
 * @see {@link animeRelationsRepository}
 */
export type AnimeRelationsDB = InferSelectModel<typeof animeRelatedAnime>

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

/**
 * Row shape for the `anime_character` join table.
 *
 * @remarks
 * **Key fields:** `animeId`, `characterId`, `role` (Main, Supporting, …)
 *
 * @see {@link animeCharacterRepository}
 */
export type AnimeCharacterDB = InferSelectModel<typeof animeCharacter>

/**
 * Row shape for the `anime_producer` join table.
 */
export type AnimeProducerDB = InferSelectModel<typeof animeProducer>

/**
 * Row shape for the `anime_staff` join table.
 *
 * @remarks
 * **Key fields:** `animeId`, `staffId`, `role` (comma-separated positions)
 *
 * @see {@link animeStaffRepository}
 */
export type AnimeStaffDB = InferSelectModel<typeof animeStaff>

/**
 * Row shape for the `anime_theme` join table (taxonomy link, not OP/ED music).
 */
export type AnimeThemeDB = InferSelectModel<typeof animeTheme>

/**
 * Row shape for the `anime_genre` join table.
 */
export type AnimeGenreDB = InferSelectModel<typeof animeGenre>

/**
 * Row shape for the `character_voice_actor` join table.
 *
 * @remarks
 * **Key fields:** `characterId`, `staffId`, `language`
 *
 * @see {@link characterStaffRepository}
 */
export type CharacterVoiceActorDB = InferSelectModel<typeof characterVoiceActor>
