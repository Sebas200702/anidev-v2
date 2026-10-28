/**
 * Domain constants for producers (studios, producers, licensors, magazines).
 *
 * @module domains/producer/constants
 */

/**
 * Credit roles across media: anime (`anime_producer.role`) plus manga
 * magazines (`manga_producer.role = 'serialization'`).
 */
export const PRODUCER_ROLES = [
  'studio',
  'producer',
  'licensor',
  'serialization',
] as const

/** Whitelisted sort fields for the producer list. */
export const producerSortFields = ['works', 'name'] as const

/** `producer_title.type` of the canonical name. */
export const DEFAULT_PRODUCER_TITLE_TYPE = 'Default'
