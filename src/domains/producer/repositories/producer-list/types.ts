/**
 * Row types of the producer list repository.
 *
 * @module domains/producer/repositories/producer-list/types
 */

/** A producer row of the list; `name` is `null` when it has no title. */
export type ProducerListRow = {
  malId: number
  name: string | null
  works: number
}
