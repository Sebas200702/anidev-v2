/**
 * Database row types for anime join/relation tables.
 *
 * @module domains/anime/types/anime-relations-db
 * @remarks
 * All types use `InferSelectModel` — they represent **read** row shapes from join tables linking
 * anime to characters, staff, producers, taxonomy, related anime, and voice actors.
 */
import type { InferSelectModel } from 'drizzle-orm'
import {
  animeRelatedAnime,
  animeCharacter,
  animeGenre,
  animeProducer,
  animeStaff,
  animeTheme,
} from '@db/schemas/anime-relations'
import { characterVoiceActor } from '@db/schemas/character-relations'

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
