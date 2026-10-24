/**
 * Producer list use case.
 *
 * @module domains/producer/services/producer-list/service
 */
import type { StaleResult } from '@lib/cache/cache-store-types'
import {
  producerCacheKeys,
  withProducerCache,
} from '@producer/cache/producer-cache'
import { mapProducerCard } from '@producer/mappers/producer'
import { producerListRepository } from '@producer/repositories/producer-list'
import type { ProducerCard, ProducerListQuery } from '@producer/types'

/** Coordinates the cached, paginated producer list. */
export const producerListService = {
  /**
   * Loads a page of producers and the total.
   *
   * @param query - Validated list query
   * @returns `{ value: { list, total }, isStale }`
   * @throws {InfraError} On database failure with no cached copy
   */
  getProducers(
    query: ProducerListQuery
  ): Promise<StaleResult<{ list: ProducerCard[]; total: number }>> {
    return withProducerCache(producerCacheKeys.list(query), async () => {
      const [rows, total] = await Promise.all([
        producerListRepository.getProducers(query),
        producerListRepository.countProducers(query),
      ])
      return { list: rows.map(mapProducerCard), total }
    })
  },
}
