/**
 * Types of the producer domain, inferred from its Zod schemas.
 *
 * @module domains/producer/types
 */
import type { z } from 'zod'
import type {
  producerCardSchema,
  producerDetailsSchema,
  producerListQuerySchema,
} from '@producer/schemas/producer-schema'
import type { PRODUCER_ROLES } from '@producer/constants'

/** A credit role (`studio`, `producer`, `licensor`, `serialization`). */
export type ProducerRole = (typeof PRODUCER_ROLES)[number]

/** Validated `GET /api/producers` query. */
export type ProducerListQuery = z.infer<typeof producerListQuerySchema>

/** A producer in the list. */
export type ProducerCard = z.infer<typeof producerCardSchema>

/** Producer detail payload. */
export type ProducerDetails = z.infer<typeof producerDetailsSchema>
