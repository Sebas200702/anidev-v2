/**
 * Producer detail use case.
 *
 * @module domains/producer/services/producer-details/service
 */
import type { StaleResult } from '@lib/cache/cache-store-types'
import {
  producerCacheKeys,
  withProducerCache,
} from '@producer/cache/producer-cache'
import { producerNotFound } from '@producer/errors'
import { mapProducerDetails } from '@producer/mappers/producer'
import { producerDetailsRepository } from '@producer/repositories/producer-details'
import type { ProducerDetails } from '@producer/types'

/** Coordinates the cached producer detail. */
export const producerDetailsService = {
  /**
   * Loads a producer with its titles and credit counts.
   *
   * @param malId - MyAnimeList producer id
   * @returns `{ value, isStale }`
   * @throws {DomainError} `PRODUCER_NOT_FOUND` when the id does not exist
   * @throws {InfraError} On database failure with no cached copy
   */
  getProducerDetails(malId: number): Promise<StaleResult<ProducerDetails>> {
    return withProducerCache(producerCacheKeys.details(malId), async () => {
      const producer = await producerDetailsRepository.getProducer(malId)
      if (!producer) throw producerNotFound(malId)

      const [titles, credits] = await Promise.all([
        producerDetailsRepository.getTitles(malId),
        producerDetailsRepository.getCreditCounts(malId),
      ])
      return mapProducerDetails({ producer, titles, credits })
    })
  },
}
