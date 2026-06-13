/**
 * @module @domains/music/types
 * @remarks Barrel exports for music domain TypeScript types, including Drizzle-derived
 * database row shapes and Zod-inferred API payload types.
 * @see {@link ./music-details.d-types} for {@link MusicDetails} and nested API types
 * @see {@link ./music-db.d-types} for database row aliases
 * @example
 * ```typescript
 * import type { MusicDetails, MusicDB } from '@domains/music/types'
 * ```
 */
export * from './music-db.d-types'
export * from './music-details.d-types'
export * from './music-card.d-types'
export * from './music-list.d-types'
