/**
 * @module @domains/music/schemas/music-metadata-schema
 * @remarks Zod schema for stable music metadata cached independently from playback data.
 */
import { z } from 'zod'
import { musicCardArtistSchema } from '@domains/music/schemas/music-card-schema'

/**
 * Validates stable music metadata cached per internal music ID.
 *
 * @remarks
 * Excludes versions and resolutions so title, type, and artist credits can be
 * reused across list, detail, and anime aggregate responses with a longer TTL.
 *
 * @see {@link MusicMetadata}
 */
export const musicMetadataSchema = z.object({
  id: z.number(),
  title: z.string(),
  type: z.enum(['opening', 'ending', 'unknown']),
  typeCode: z.enum(['OP', 'ED', 'UNK']),
  artists: z.array(musicCardArtistSchema),
})
