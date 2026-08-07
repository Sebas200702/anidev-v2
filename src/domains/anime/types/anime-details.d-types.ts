/**
 * Domain types for anime detail page payloads.
 *
 * @module domains/anime/types/anime-details
 */
import type { animeDetailsSchema } from '@anime/schemas/anime-details-schema'
import type { z } from 'zod'

/**
 * Primary anime detail payload for public pages.
 *
 * @remarks
 * Inferred from {@link animeDetailsSchema}. Cached as {@link AnimeDetails} in
 * {@link animeDetailsCache}. Includes marketing URLs (`shareText`, `watchUrl`) and
 * poster/banner CDN links.
 *
 * @see {@link animeService.getAnimeDetails}
 * @see {@link mapAnimeDetails}
 */
export type AnimeDetails = z.infer<typeof animeDetailsSchema>
