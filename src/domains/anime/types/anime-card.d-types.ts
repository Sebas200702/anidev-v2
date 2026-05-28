/**
 * Domain types for anime card payloads.
 *
 * @module domains/anime/types/anime-card
 */
import { z } from 'zod'
import { animeCardSchema } from '@domains/anime/schemas/anime-card-schema'

/**
 * Compact anime summary used in list and grid views.
 *
 * @remarks
 * Inferred from {@link animeCardSchema}. Produced by {@link mapAnimeCard}.
 *
 * @see {@link AnimeListResponse}
 */
export type AnimeCard = z.infer<typeof animeCardSchema>
