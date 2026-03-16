import { animeRelatedAnime } from '@/core/db/schemas/anime-relations'
import { anime } from '@/core/db/schemas/anime'
import { dbError } from '@/core/errors/db-errors'
import type { AnimeRelationsDB, AnimeDB } from '@/domains/anime/types/anime-db'
import { eq } from 'drizzle-orm'
import { db } from '@/core/db/client'

export const animeRelationsRepository = {
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
