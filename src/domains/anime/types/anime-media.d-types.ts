/**
 * Types inferred from the anime media API schemas.
 *
 * @module domains/anime/types/anime-media.d-types
 */
import type { animeMediaItemSchema } from '@anime/schemas/anime-media-schema'
import type { z } from 'zod'

/** One anime media asset as returned by `/api/anime/:malId/media`. */
export type AnimeMediaItem = z.infer<typeof animeMediaItemSchema>
