/**
 * Existence checks of catalog ids referenced by a user's preferences.
 *
 * @module domains/user/repositories/catalog-ids/repository
 */
import { db } from '@db/client'
import { anime } from '@db/schemas/anime'
import { genre } from '@db/schemas/anime-taxonomy'
import { producer } from '@db/schemas/producer'
import { dbError } from '@shared/errors/db-errors'
import { inArray } from 'drizzle-orm'
import type { CatalogIdLists } from './types'

const tables = {
  genres: { table: genre, id: genre.malId },
  studios: { table: producer, id: producer.malId },
  animes: { table: anime, id: anime.malId },
} as const

/** Returns the ids of `ids` that have no row in the list's table. */
const missingIn = async (
  list: keyof typeof tables,
  ids: number[] | undefined
): Promise<number[]> => {
  if (!ids?.length) return []
  const { table, id } = tables[list]
  const rows = await db.select({ id }).from(table).where(inArray(id, ids))
  const found = new Set(rows.map((row) => row.id))
  return ids.filter((value) => !found.has(value))
}

/** Repository that validates preference ids against the catalog. */
export const catalogIdsRepository = {
  /**
   * Finds the ids that do not exist in their catalog table.
   *
   * @param lists - `genres` (genre), `studios` (producer), `animes` (anime)
   * @returns The unknown ids per list (empty arrays when all exist)
   * @throws {InfraError} On database failure
   */
  async findMissing(lists: CatalogIdLists): Promise<Required<CatalogIdLists>> {
    try {
      const [genres, studios, animes] = await Promise.all([
        missingIn('genres', lists.genres),
        missingIn('studios', lists.studios),
        missingIn('animes', lists.animes),
      ])
      return { genres, studios, animes }
    } catch (error) {
      throw dbError('[FIND_MISSING_CATALOG_IDS]', {}, error)
    }
  },
}
