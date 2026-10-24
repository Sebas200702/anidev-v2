/**
 * Data access for the paginated producer list.
 *
 * @module domains/producer/repositories/producer-list/repository
 */
import { db } from '@db/client'
import { dbError } from '@shared/errors/db-errors'
import type { ProducerListQuery } from '@producer/types'
import { sql } from 'drizzle-orm'
import { producerListFromSql, producerListOrderSql } from './helpers'
import type { ProducerListRow } from './types'

/**
 * Repository for listing producers with their credited-work counts.
 *
 * @remarks
 * **Tables:** `producer`, `producer_title` (names, title search) and the
 * credits of `anime_producer` + `manga_producer`. ~3k producers, so the
 * aggregate needs no dedicated index.
 */
export const producerListRepository = {
  /**
   * Loads one page of producers.
   *
   * @param query - Validated list query
   * @returns Rows with `malId`, `name` and `works`
   * @throws {InfraError} On database failure
   */
  async getProducers(query: ProducerListQuery): Promise<ProducerListRow[]> {
    const { page, limit, sort } = query
    try {
      const result = await db.execute<ProducerListRow>(sql`
        SELECT p.mal_id AS "malId", n.title AS name,
          COALESCE(w.works, 0)::int AS works
        ${producerListFromSql(query)}
        ${producerListOrderSql(sort)}
        LIMIT ${limit} OFFSET ${(page - 1) * limit}`)
      return result.rows
    } catch (error) {
      throw dbError('[GET_PRODUCERS]', { page, limit }, error)
    }
  },

  /**
   * Counts the producers matching the query.
   *
   * @param query - Validated list query (pagination ignored)
   * @returns Total matches
   * @throws {InfraError} On database failure
   */
  async countProducers(query: ProducerListQuery): Promise<number> {
    try {
      const result = await db.execute<{ total: number }>(
        sql`SELECT count(*)::int AS total ${producerListFromSql(query)}`
      )
      return result.rows[0]?.total ?? 0
    } catch (error) {
      throw dbError('[COUNT_PRODUCERS]', {}, error)
    }
  },
}
