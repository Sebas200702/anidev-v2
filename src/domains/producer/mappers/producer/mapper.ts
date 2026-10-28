/**
 * Maps producer rows to API DTOs.
 *
 * @module domains/producer/mappers/producer/mapper
 */
import { PRODUCER_ROLES } from '@producer/constants'
import type { ProducerCard, ProducerDetails } from '@producer/types'
import type { ProducerListRow } from '@producer/repositories/producer-list'
import type { MapProducerDetailsInput } from './types'

/** Display name when a producer has no title row at all. */
const fallbackName = (malId: number) => `Producer ${malId}`

/**
 * Maps a list row to a card.
 *
 * @param row - List row (`name` may be `null`)
 * @returns {@link ProducerCard}
 */
export const mapProducerCard = ({
  malId,
  name,
  works,
}: ProducerListRow): ProducerCard => ({
  malId,
  name: name ?? fallbackName(malId),
  works,
})

/**
 * Maps the producer row, its titles and credit counts to the detail DTO.
 *
 * @param input - Rows from the details repository (titles `Default` first)
 * @returns {@link ProducerDetails} with a zero count for roles without credits
 */
export const mapProducerDetails = ({
  producer: { malId, established, about },
  titles,
  credits,
}: MapProducerDetailsInput): ProducerDetails => {
  const worksByRole = new Map(credits.map(({ role, works }) => [role, works]))
  const counts = Object.fromEntries(
    PRODUCER_ROLES.map((role) => [role, worksByRole.get(role) ?? 0])
  ) as ProducerDetails['counts']

  return {
    malId,
    name: titles[0]?.title ?? fallbackName(malId),
    titles,
    established: established ?? null,
    about: about ?? null,
    counts,
  }
}
