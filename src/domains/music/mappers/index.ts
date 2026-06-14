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

export { mapMusicCard, mapMusicCardFromMetadata, mapMusicListToCards } from './music-card-mapper'
export { mapMusicDetail } from './music-detail-mapper'
export { mapMusicMetadata } from './music-metadata-mapper'
export { mapMusicVersions } from './music-versions-mapper'
export { mapMusicListFilters } from './music-filters-mapper'
