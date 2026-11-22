/**
 * Types inferred from the anime music API schemas.
 *
 * @module domains/anime/types/anime-music.d-types
 */
import type { animeMusicItemSchema } from '@anime/schemas/anime-music-schema'
import type { z } from 'zod'

/** One anime opening or ending as returned by `/api/anime/:malId/music`. */
export type AnimeMusicItem = z.infer<typeof animeMusicItemSchema>
