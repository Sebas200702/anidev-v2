/**
 * @module @domains/music/schemas
 * @remarks Barrel exports for Zod schemas validating music API routes and response payloads.
 * @see {@link ./music-details-schema} for the {@link MusicDetails} shape
 * @see {@link ./api-schema} for route param and response wrappers
 * @example
 * ```typescript
 * import { getMusicSchema, musicDetailsSchema } from '@domains/music/schemas'
 * ```
 */

export { getMusicSchema, musicDetailsResponseSchema } from './api-schema'
export { musicCardArtistSchema, musicCardSchema } from './music-card-schema'
export { musicArtistSchema, musicResolutionSchema, musicVersionSchema, musicDetailsSchema } from './music-details-schema'
export { musicListFiltersParamsSchema, musicListFiltersSchema, musicListRequestSchema, musicListResponseSchema } from './music-list-schema'
