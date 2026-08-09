/**
 * @module @music/mappers
 * @remarks Barrel exports for music mappers that transform database rows into API-facing
 * {@link MusicDetails} payloads.
 * @see {@link ./music-detail-mapper} for the primary detail mapper
 * @example
 * ```typescript
 * import { mapMusicDetail } from '@music/mappers'
 * ```
 */

export { mapMusicCard, mapMusicListToCards } from './music-card'
export { mapMusicDetail } from './music-detail'
export { mapMusicListFilters } from './music-filters'
