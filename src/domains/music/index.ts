/**
 * @module @domains/music
 * @remarks Public entry point for the music domain. Re-exports cache helpers, domain
 * errors, mappers, repositories, Zod schemas, services, and inferred TypeScript types
 * used to load and serialize {@link MusicDetails} payloads for opening/ending tracks.
 * @see {@link ./services/music-service} for the primary read orchestration layer
 * @see {@link ./types/music-details.d-types} for the public API response shape
 * @example
 * ```typescript
 * import { musicService, MusicDetails } from '@domains/music'
 *
 * const details: MusicDetails = await musicService.getMusicDetailsById(42)
 * console.log(details.title, details.type)
 * ```
 */
export * from './cache'
export * from './errors'
export * from './mappers'
export * from './repositories'
export * from './schemas'
export * from './services'
export * from './types'
