/**
 * @module @domains/music/mappers
 * @remarks Barrel exports for music mappers that transform database rows into API-facing
 * {@link MusicDetails} payloads.
 * @see {@link ./music-detail-mapper} for the primary detail mapper
 * @example
 * ```typescript
 * import { mapMusicDetail } from '@domains/music/mappers'
 * ```
 */
export * from './music-card-mapper'
export * from './music-detail-mapper'
export * from './music-filters-mapper'
