/**
 * Input types of the producer mappers.
 *
 * @module domains/producer/mappers/producer/types
 */
import type {
  ProducerCreditCountRow,
  ProducerRow,
  ProducerTitleRow,
} from '@producer/repositories/producer-details'

/** Rows behind a producer detail. */
export interface MapProducerDetailsInput {
  producer: ProducerRow
  titles: ProducerTitleRow[]
  credits: ProducerCreditCountRow[]
}
