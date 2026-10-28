/**
 * Data access for the person name search.
 *
 * @module domains/people/repositories/person-search/repository
 */
import { db } from '@db/client'
import { staff } from '@db/schemas/staff'
import { dbError } from '@shared/errors/db-errors'
import { containsPattern } from '@people/repositories/shared/sql'
import type { PeopleSearchQuery, PersonCardRow } from '@people/types'
import { asc, count, desc, ilike, sql } from 'drizzle-orm'

/** Repository for searching people by name (GIN `pg_trgm` on `name`). */
export const personSearchRepository = {
  /**
   * Loads one page of matches, most favorited first.
   *
   * @param query - Validated `{ query, page, limit }`
   * @returns Card rows
   * @throws {InfraError} On database failure
   */
  async search({
    query,
    page,
    limit,
  }: PeopleSearchQuery): Promise<PersonCardRow[]> {
    try {
      return await db
        .select({
          malId: staff.malId,
          name: staff.name,
          favorites: staff.favorites,
        })
        .from(staff)
        .where(ilike(staff.name, containsPattern(query)))
        .orderBy(sql`${desc(staff.favorites)} NULLS LAST`, asc(staff.malId))
        .limit(limit)
        .offset((page - 1) * limit)
    } catch (error) {
      throw dbError('[SEARCH_PEOPLE]', { page, limit }, error)
    }
  },

  /**
   * Counts the matches of a search.
   *
   * @param query - Search term
   * @returns Total matches
   * @throws {InfraError} On database failure
   */
  async count(query: string): Promise<number> {
    try {
      const rows = await db
        .select({ value: count() })
        .from(staff)
        .where(ilike(staff.name, containsPattern(query)))
      return rows[0]?.value ?? 0
    } catch (error) {
      throw dbError('[COUNT_PEOPLE]', {}, error)
    }
  },
}
