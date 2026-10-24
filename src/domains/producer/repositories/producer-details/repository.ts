/**
 * Data access for a single producer.
 *
 * @module domains/producer/repositories/producer-details/repository
 */
import { db } from '@db/client'
import { producer, producerTitle } from '@db/schemas/producer'
import { DEFAULT_PRODUCER_TITLE_TYPE } from '@producer/constants'
import { dbError } from '@shared/errors/db-errors'
import { asc, eq, sql } from 'drizzle-orm'
import type {
  ProducerCreditCountRow,
  ProducerRow,
  ProducerTitleRow,
} from './types'

/** Repository for the producer row, its titles and its credit counts. */
export const producerDetailsRepository = {
  /**
   * Loads the producer row.
   *
   * @param malId - MyAnimeList producer id
   * @returns The row, or `undefined` when it does not exist
   * @throws {InfraError} On database failure
   */
  async getProducer(malId: number): Promise<ProducerRow | undefined> {
    try {
      const rows = await db
        .select({
          malId: producer.malId,
          established: producer.established,
          about: producer.about,
        })
        .from(producer)
        .where(eq(producer.malId, malId))
        .limit(1)
      return rows[0]
    } catch (error) {
      throw dbError('[GET_PRODUCER]', { malId }, error)
    }
  },

  /**
   * Loads every title, the `Default` one first.
   *
   * @param malId - MyAnimeList producer id
   * @returns Titles with their type
   * @throws {InfraError} On database failure
   */
  async getTitles(malId: number): Promise<ProducerTitleRow[]> {
    try {
      return await db
        .select({ title: producerTitle.title, type: producerTitle.type })
        .from(producerTitle)
        .where(eq(producerTitle.producerId, malId))
        .orderBy(
          sql`${producerTitle.type} <> ${DEFAULT_PRODUCER_TITLE_TYPE}`,
          asc(producerTitle.title)
        )
    } catch (error) {
      throw dbError('[GET_PRODUCER_TITLES]', { malId }, error)
    }
  },

  /**
   * Counts the credited works per role across anime and manga.
   *
   * @param malId - MyAnimeList producer id
   * @returns One row per role with at least one credit
   * @throws {InfraError} On database failure
   */
  async getCreditCounts(malId: number): Promise<ProducerCreditCountRow[]> {
    try {
      const result = await db.execute<ProducerCreditCountRow>(sql`
        SELECT role, count(*)::int AS works FROM (
          SELECT role FROM anime_producer WHERE producer_id = ${malId}
          UNION ALL
          SELECT role FROM manga_producer WHERE producer_id = ${malId}
        ) c GROUP BY role`)
      return result.rows
    } catch (error) {
      throw dbError('[GET_PRODUCER_CREDITS]', { malId }, error)
    }
  },
}
