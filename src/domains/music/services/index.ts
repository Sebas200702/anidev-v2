/**
 * @module @music/services
 * @remarks Barrel exports for music application services that orchestrate repositories,
 * mappers, and cache layers.
 * @see {@link ./music-service} for music detail reads
 * @see {@link ./music-list-service} for paginated list reads
 * @example
 * ```typescript
 * import { musicService, musicListService } from '@music/services'
 * ```
 */

export { getMusicByAnimeId } from './anime-music'
export { musicListService } from './music-list'
export { musicService } from './music'
