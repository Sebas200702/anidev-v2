/**
 * Data access for core anime records.
 *
 * @module domains/anime/repositories/anime-repository
 */
import { db } from '@db/client'
import { anime } from '@db/schemas/anime'
import { eq, inArray } from 'drizzle-orm'
import { dbError } from '@shared/errors/db-errors'
import type { AnimeDB } from '@domains/anime/types'

/**
 * Repository for querying anime rows from the database.
 *
 * @remarks
 * **Table:** `anime` (Drizzle schema `@db/schemas/anime`)
 *
 * **Primary key / lookup:** `mal_id` (column `malId`)
 *
 * **SQL behavior:** `SELECT *` with `WHERE mal_id = ?` or `IN (...)`.
 *
 * **Empty vs null:** `getAnimeByMalId` returns `undefined` when no row exists
 * (not `null`). `getManyAnimeByMalIds` returns `[]` for empty input or no matches.
 *
 * **Failures:** Drizzle/driver errors become {@link InfraError} via `dbError` → HTTP 500
 * in {@link mapErrorToHttp}.
 *
 * @see {@link animeService} — single-row lookup + not-found handling
 * @see {@link mapAnimeDetails}
 */
export const animeRepository = {
  /**
   * Loads a single anime row by MAL ID.
   *
   * @param malId - MyAnimeList identifier (`anime.mal_id`)
   * @returns Full {@link AnimeDB} row, or `undefined` if not found
   *
   * @throws {InfraError} On database failure (`[GET_ANIME_BY_MAL_ID]`)
   *
   * @example
   * ```typescript
   * const row = await animeRepository.getAnimeByMalId(5114)
   * if (!row) throw animeNotFound(5114)
   * ```
   *
   * @see {@link animeRepository.getManyAnimeByMalIds}
   */
  async getAnimeByMalId(malId: number): Promise<AnimeDB | undefined> {
    try {
      const [result] = await db
        .select()
        .from(anime)
        .where(eq(anime.malId, malId))
      return result
    } catch (error) {
      throw dbError('[GET_ANIME_BY_MAL_ID]', { malId }, error)
    }
  },

  /**
   * Loads multiple anime rows by MAL IDs.
   *
   * @param malIds - MyAnimeList identifiers
   * @returns All matching rows (may be fewer than `malIds.length`; order not guaranteed)
   *
   * @throws {InfraError} On database failure (`[GET_MANY_ANIME_BY_MAL_IDS]`)
   *
   * @remarks
   * Does not preserve input order; callers should index by `malId` if needed.
   */
  async getManyAnimeByMalIds(malIds: number[]): Promise<AnimeDB[]> {
    try {
      return await db
        .select()
        .from(anime)
        .where(inArray(anime.malId, malIds))
    } catch (error) {
      throw dbError('[GET_MANY_ANIME_BY_MAL_IDS]', { malIds }, error)
    }
  },
}
