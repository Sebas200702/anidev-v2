/**
 * @module @domains/music/types/music-metadata-types
 * @remarks Inferred API types for cached music metadata payloads.
 */
import { z } from 'zod'
import { musicMetadataSchema } from '@domains/music/schemas/music-metadata-schema'

/**
 * Stable music metadata cached per internal ID.
 *
 * @remarks
 * Shared by list cards, detail responses, and anime full payloads. Playback
 * versions and resolutions are cached separately via {@link musicVersionsCache}.
 *
 * @see {@link musicMetadataCache}
 */
export type MusicMetadata = z.infer<typeof musicMetadataSchema>
