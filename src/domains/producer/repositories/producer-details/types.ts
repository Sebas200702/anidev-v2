/**
 * Row types of the producer details repository.
 *
 * @module domains/producer/repositories/producer-details/types
 */

/** Core producer row. */
export type ProducerRow = {
  malId: number
  established: string | null
  about: string | null
}

/** A producer title and its type (`Default`, `Japanese`, `Synonym`, …). */
export type ProducerTitleRow = {
  title: string
  type: string
}

/** Credited works of one role. */
export type ProducerCreditCountRow = {
  role: string
  works: number
}
