/**
 * @module @domains/music/types/music-details.d-types
 * @remarks Inferred API types for music detail payloads. All types are derived from Zod
 * schemas in {@link ../schemas/music-details-schema} so runtime validation and compile-time
 * types stay in sync.
 */
import { z } from 'zod'
import {
  musicArtistSchema,
  musicDetailsSchema,
  musicResolutionSchema,
  musicVersionSchema,
} from '@domains/music/schemas/music-details-schema'

/**
 * Public music detail response shape.
 *
 * @remarks Returned by {@link musicService.getMusicDetailsById}. Metadata is cached via
 * {@link musicMetadataCache}; versions and resolutions via {@link musicVersionsCache}.
 * version/resolution playback URLs.
 * @see {@link musicDetailsSchema} for runtime validation
 * @see {@link mapMusicDetail} for database-to-API mapping
 * @example
 * ```typescript
 * const details: MusicDetails = {
 *   title: 'Unravel',
 *   type: 'opening',
 *   typeCode: 'OP',
 *   artist: [{ name: 'TK from Ling tosite sigure', malId: 0 }],
 *   versions: [{
 *     musicId: 42,
 *     version: 1,
 *     versionId: 7,
 *     resolutions: [{
 *       resolution: '1080p',
 *       audioUrl: 'https://example.com/audio.m4a',
 *       videoUrl: 'https://example.com/video.mp4',
 *       songId: 1,
 *     }],
 *   }],
 * }
 * ```
 */
export type MusicDetails = z.infer<typeof musicDetailsSchema>

/**
 * Artist entry on a music detail payload.
 *
 * @remarks Nested under {@link MusicDetails.artist}.
 * @see {@link musicArtistSchema} for runtime validation
 * @example
 * ```typescript
 * const artist: MusicArtist = { name: 'LiSA', malId: 12345 }
 * ```
 */
export type MusicArtist = z.infer<typeof musicArtistSchema>

/**
 * Playable resolution entry for a music version.
 *
 * @remarks Nested under {@link MusicVersion.resolutions} with direct streaming URLs.
 * @see {@link musicResolutionSchema} for runtime validation
 * @example
 * ```typescript
 * const resolution: MusicResolution = {
 *   resolution: '720p',
 *   audioUrl: 'https://example.com/audio.m4a',
 *   videoUrl: 'https://example.com/video.mp4',
 *   songId: 2,
 * }
 * ```
 */
export type MusicResolution = z.infer<typeof musicResolutionSchema>

/**
 * Version entry with nested resolutions.
 *
 * @remarks Nested under {@link MusicDetails.versions}. Multiple versions represent
 * alternate cuts of the same track (TV size, full, etc.).
 * @see {@link musicVersionSchema} for runtime validation
 * @example
 * ```typescript
 * const version: MusicVersion = {
 *   musicId: 42,
 *   version: 1,
 *   versionId: 7,
 *   resolutions: [],
 * }
 * ```
 */
export type MusicVersion = z.infer<typeof musicVersionSchema>
