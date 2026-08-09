/**
 * Type definitions for the full anime detail mapper helpers.
 *
 * @module domains/anime/mappers/anime-full/helpers.types
 */

/** Grouped relation entry used while building full detail payloads. */
export interface RelationGroupEntry {
  relatedId: number
  title: string
  url: string
}

/** Grouped relation bucket keyed by relation type. */
export interface RelationGroup {
  relation: string
  entry: RelationGroupEntry[]
}
