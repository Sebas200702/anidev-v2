/**
 * @module @domains/media/repositories
 * @remarks Barrel exports for entity-specific media asset repositories. Each repository loads
 * persisted `src` URLs and metadata from the corresponding media join table.
 * @see {@link ./anime-media-repository} for anime assets
 * @see {@link ./character-media-repository} for character assets
 * @see {@link ./staff-media-repository} for staff assets
 * @example
 * ```typescript
 * import { animeMediaRepository } from '@domains/media/repositories'
 * ```
 */
export * from './anime-media-repository'
export * from './character-media-repository'
export * from './staff-media-repository'
