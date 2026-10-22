/**
 * Data access for anime relation records.
 *
 * @module domains/anime/repositories/anime-relations/repository
 */
import { animeProducer, animeRelatedAnime } from '@db/schemas/anime-relations'
import { producer, producerTitle } from '@db/schemas/producer'
import { anime } from '@db/schemas/anime'
import { dbError } from '@shared/errors/db-errors'
import type { AnimeDB, AnimeRelationsDB } from '@anime/types'
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
   * Loads the companies credited on an anime with their role.
   *
   * @param animeId - Source anime MAL ID (`anime_producer.anime_id`)
   * @returns `{ name, role }` rows: studios, licensors and producers
   *
   * @throws {InfraError} (`[GET_PRODUCERS_BY_ANIME_ID]`)
   *
   * @remarks The display name lives in `producer_title` (the `Default` variant);
   * the MAL company id is `producer.mal_id`.
   */
  async getProducersByAnimeId(
    animeId: number
  ): Promise<{ name: string; role: string; malId: number }[]> {
    try {
      const rows = await db
        .select({
          name: producerTitle.title,
          role: animeProducer.role,
          malId: producer.malId,
        })
        .from(animeProducer)
        .innerJoin(producer, eq(animeProducer.producerId, producer.malId))
        .innerJoin(producerTitle, eq(producerTitle.producerId, producer.malId))
        .where(eq(animeProducer.animeId, animeId))

      return rows
    } catch (error) {
      throw dbError('[GET_PRODUCERS_BY_ANIME_ID]', { animeId }, error)
    }
  },

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
   * Selected columns: `malId`, titles, `type`, `episodes`, `status`, `score`, etc., plus the
   * catalog-coverage fields (broadcast, aired window, trailer, stats).
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
          broadcastDay: anime.broadcastDay,
          broadcastTime: anime.broadcastTime,
          broadcastTimezone: anime.broadcastTimezone,
          airedFrom: anime.airedFrom,
          airedTo: anime.airedTo,
          trailerYoutubeId: anime.trailerYoutubeId,
          trailerEmbedUrl: anime.trailerEmbedUrl,
          duration: anime.duration,
          source: anime.source,
          rank: anime.rank,
          members: anime.members,
          favorites: anime.favorites,
        })
        .from(anime)
        .innerJoin(
          animeRelatedAnime,
          eq(animeRelatedAnime.relatedAnimeId, anime.malId)
        )
        .where(eq(animeRelatedAnime.animeId, animeId))
    } catch (error) {
      throw dbError(
        '[GET_ANIME_RELATED_ANIME_DATA_BY_ANIME_ID]',
        { animeId },
        error
      )
    }
  },
}
