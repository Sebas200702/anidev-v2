/**
 * @module @domains/music/errors
 * @remarks Barrel exports for music domain errors and factory helpers used by route
 * handlers and {@link musicService} when identifiers are invalid or records are missing.
 * @see {@link ./music-not-found-error} for missing-record errors
 * @see {@link ./music-invalid-id-error} for malformed route parameters
 * @example
 * ```typescript
 * import { musicNotFound, musicInvalidId } from '@domains/music/errors'
 *
 * throw musicNotFound(42)
 * throw musicInvalidId('abc')
 * ```
 */
export * from './music-invalid-id-error'
export * from './music-not-found-error'
