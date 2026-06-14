/**
 * Domain types for music card payloads.
 *
 * @module domains/music/types/music-card
 */
import { z } from 'zod'
import { musicCardSchema } from '@domains/music/schemas/music-card-schema'

/**
 * Compact music summary used in list views.
 *
 * @remarks
 * Inferred from {@link musicCardSchema}. Produced by {@link mapMusicCard}.
 *
 * @see {@link MusicListResponse}
 */
export type MusicCard = z.infer<typeof musicCardSchema>
