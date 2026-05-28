/**
 * @module @domains/media
 * @remarks Public entry point for the media domain. Re-exports cache helpers, mappers,
 * repositories, Zod schemas, services, types, and runtime configuration for semantic media
 * path parsing, asset resolution, remote fetching, and image optimization.
 * @see {@link ./services/media-service} for the optimization pipeline orchestrator
 * @see {@link ./mappers/media-url-mapper} for semantic URL construction
 * @example
 * ```typescript
 * import { mediaService, buildMediaUrl, MediaEntity, MediaType } from '@domains/media'
 *
 * const url = buildMediaUrl({
 *   entity: MediaEntity.ANIME,
 *   entity_id: 5114,
 *   type: MediaType.POSTER,
 *   size: 'large',
 * })
 * const optimized = await mediaService.optimizeMedia(parsedPath, { width: 400 })
 * ```
 */
export * from './cache'
export * from './mappers'
export * from './repositories'
export * from './schemas'
export * from './services'
export * from './types'
export * from './config'
