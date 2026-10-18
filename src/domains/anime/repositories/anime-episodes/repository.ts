/**
 * Data access for per-anime episode rows.
 *
 * @module domains/anime/repositories/anime-episodes/repository
 */
import { and, asc, count, eq } from 'drizzle-orm'
import { db } from '@db/client'
import { episode } from '@db/schemas/episode'
import type { EpisodeDB } from '@anime/types'
import { dbError } from '@shared/errors/db-errors'
import type { EpisodesPageInput } from './types'

/**
 * Repository for the `episode` table scoped to one anime.
 *
 * @remarks
 * Every query filters by `anime_id`, served by `episode_anime_number_unique`
 * (`anime_id`, `number`). Empty results are `[]` / `0` / `undefined`, never
 * errors — the service decides between "no episodes" and "no anime".
 *
 * @see {@link animeEpisodesService}
 */
export const animeEpisodesRepository = {
  /**
   * Loads one page of an anime's episodes ordered by number.
   *
   * @param input - {@link EpisodesPageInput}
   * @returns {@link EpisodeDB} rows for the page (`[]` past the end)
   *
   * @throws {InfraError} On database failure (`[GET_EPISODES_PAGE]`)
   */
  async getEpisodesPage({
    malId,
    page,
    limit,
  }: EpisodesPageInput): Promise<EpisodeDB[]> {
    try {
      return await db
        .select()
        .from(episode)
        .where(eq(episode.animeId, malId))
        .orderBy(asc(episode.number))
        .limit(limit)
        .offset((page - 1) * limit)
    } catch (error) {
      throw dbError('[GET_EPISODES_PAGE]', { malId, page, limit }, error)
    }
  },

  /**
   * Counts an anime's episodes.
   *
   * @param malId - Parent anime MAL ID
   * @returns Episode count (`0` when none)
   *
   * @throws {InfraError} On database failure (`[COUNT_EPISODES]`)
   */
  async countEpisodes(malId: number): Promise<number> {
    try {
      const result = await db
        .select({ count: count() })
        .from(episode)
        .where(eq(episode.animeId, malId))
      return result[0]?.count ?? 0
    } catch (error) {
      throw dbError('[COUNT_EPISODES]', { malId }, error)
    }
  },

  /**
   * Loads one episode by its number within an anime.
   *
   * @param malId - Parent anime MAL ID
   * @param number - Episode number
   * @returns The {@link EpisodeDB} row, or `undefined` when absent
   *
   * @throws {InfraError} On database failure (`[GET_EPISODE_BY_NUMBER]`)
   */
  async getEpisodeByNumber(
    malId: number,
    number: number
  ): Promise<EpisodeDB | undefined> {
    try {
      const [row] = await db
        .select()
        .from(episode)
        .where(and(eq(episode.animeId, malId), eq(episode.number, number)))
        .limit(1)
      return row
    } catch (error) {
      throw dbError('[GET_EPISODE_BY_NUMBER]', { malId, number }, error)
    }
  },
}
