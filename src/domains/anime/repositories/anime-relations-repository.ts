/**
 * Data access for anime relation records.
 *
 * @module domains/anime/repositories/anime-relations-repository
 */
import { animeRelatedAnime } from '@db/schemas/anime-relations'
import { anime } from '@db/schemas/anime'
import { dbError } from '@shared/errors/db-errors'
import type { AnimeDB, AnimeRelationsDB } from '@domains/anime/types'
import { eq } from 'drizzle-orm'
import { db } from '@db/client'

/**
 * Repository for querying related anime links and related row data.
 *
 * @remarks
 * **Tables:** `anime_related_anime`, inner-joined `anime` for related titles
 *
 * @see {@link animeFullService}
 * @see {@link mapAnimeToFullDetails}
 */
export const animeRelationsRepository = {
  /**
   * Loads relation rows linked to an anime.
   *
   * @param animeId - Source anime MAL ID (`anime_related_anime.anime_id`)
   * @returns `{ relatedAnimeId, relationType, animeId }` projections
   *
   * @throws {InfraError} (`[GET_RELATED_ANIME_BY_ANIME_ID]`)
   *
   * @remarks
   * Returns `[]` when no relations; does not hydrate related anime titles.
   */
  async getRelatedAnimeByAnimeId(animeId: number): Promise<AnimeRelationsDB[]> {
    try {
      return await db
        .select({
          relatedAnimeId: animeRelatedAnime.relatedAnimeId,
          relationType: animeRelatedAnime.relationType,
          animeId: animeRelatedAnime.animeId,
        })
        .from(animeRelatedAnime)
        .where(eq(animeRelatedAnime.animeId, animeId))
    } catch (error) {
      throw dbError('[GET_RELATED_ANIME_BY_ANIME_ID]', { animeId }, error)
    }
  },

  /**
   * Loads related anime rows referenced by an anime's relation links.
   *
   * @param animeId - Source anime MAL ID
   * @returns Subset of {@link AnimeDB} columns for each related entry
   *
   * @throws {InfraError} (`[GET_ANIME_RELATED_ANIME_DATA_BY_ANIME_ID]`)
   *
   * @remarks
   * **SQL:** `anime` INNER JOIN `anime_related_anime` ON `related_anime_id = mal_id`.
   * Selected columns: `malId`, titles, `type`, `episodes`, `status`, `score`, etc.
   */
  async getAnimeRelatedAnimeDataByAnimeId(animeId: number): Promise<AnimeDB[]> {
    try {
      return await db
        .select({
          malId: anime.malId,
          title: anime.title,
          titleEnglish: anime.titleEnglish,
          titleJapanese: anime.titleJapanese,
          type: anime.type,
          episodes: anime.episodes,
          status: anime.status,
          score: anime.score,
          scoredBy: anime.scoredBy,
          synopsis: anime.synopsis,
          year: anime.year,
          popularityRank: anime.popularityRank,
          rating: anime.rating,
          background: anime.background,
          season: anime.season,
        })
        .from(anime)
        .innerJoin(
          animeRelatedAnime,
          eq(animeRelatedAnime.relatedAnimeId, anime.malId)
        )
        .where(eq(animeRelatedAnime.animeId, animeId))
    } catch (error) {
      throw dbError('[GET_ANIME_RELATED_ANIME_DATA_BY_ANIME_ID]', { animeId }, error)
    }
  },
}
