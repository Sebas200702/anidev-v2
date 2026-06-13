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
export * from './api-schema'
export * from './music-card-schema'
export * from './music-details-schema'
export * from './music-list-schema'
