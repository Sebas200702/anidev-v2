/**
 * @module @domains/music/schemas/music-details-schema
 * @remarks Zod schemas defining the public {@link MusicDetails} API payload and its nested
 * artist, version, and resolution objects.
 */
import { z } from 'zod'

/**
 * Validates an artist entry on a music detail payload.
 *
 * @remarks Each artist includes a display `name` and optional MAL identifier.
 * @see {@link MusicArtist} for the inferred TypeScript type
 * @see {@link musicDetailsSchema} for the parent object
 * @example
 * ```typescript
 * musicArtistSchema.parse({ name: 'TK from Ling tosite sigure', malId: 12345 })
 * ```
 */
export const musicArtistSchema = z.object({
  name: z.string(),
  malId: z.number(),
})

/**
 * Validates a playable resolution entry for a music version.
 *
 * @remarks Holds direct `audioUrl` and `videoUrl` strings plus a resolution label and
 * upstream `songId` reference.
 * @see {@link MusicResolution} for the inferred TypeScript type
 * @see {@link musicVersionSchema} for the parent version object
 * @example
 * ```typescript
 * musicResolutionSchema.parse({
 *   resolution: '1080p',
 *   audioUrl: 'https://example.com/audio.m4a',
 *   videoUrl: 'https://example.com/video.mp4',
 *   songId: 1,
 * })
 * ```
 */
export const musicResolutionSchema = z.object({
  resolution: z.string(),
  audioUrl: z.string(),
  videoUrl: z.string(),
  songId: z.number(),
})

/**
 * Validates a version entry with nested resolutions.
 *
 * @remarks A music track may have multiple versions (TV size, full size, etc.), each with
 * its own set of playable resolutions.
 * @see {@link MusicVersion} for the inferred TypeScript type
 * @see {@link musicDetailsSchema} for the root detail object
 * @example
 * ```typescript
 * musicVersionSchema.parse({
 *   musicId: 42,
 *   version: 1,
 *   versionId: 7,
 *   resolutions: [],
 * })
 * ```
 */
export const musicVersionSchema = z.object({
  musicId: z.number(),
  version: z.number(),
  versionId: z.number(),
  resolutions: z.array(musicResolutionSchema),
})

/**
 * Validates the public music detail payload.
 *
 * @remarks This schema is the source of truth for {@link MusicDetails}. The `type` field
 * is a human label (`opening`, `ending`, `unknown`) while `typeCode` preserves the raw
 * database enum (`OP`, `ED`, `UNK`).
 * @see {@link mapMusicDetail} for database-to-API mapping
 * @see {@link musicService.getMusicDetailsById} for runtime population
 * @example
 * ```typescript
 * const details = musicDetailsSchema.parse({
 *   title: 'Unravel',
 *   type: 'opening',
 *   typeCode: 'OP',
 *   artist: [{ name: 'TK from Ling tosite sigure', malId: 0 }],
 *   versions: [],
 * })
 * ```
 */
export const musicDetailsSchema = z.object({
  title: z.string(),
  type: z.enum(['opening', 'ending', 'unknown']),
  typeCode: z.enum(['OP', 'ED', 'UNK']),
  versions: z.array(musicVersionSchema),
  artist: z.array(musicArtistSchema),
})
