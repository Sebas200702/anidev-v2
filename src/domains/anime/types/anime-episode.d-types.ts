/**
 * Domain types for the anime episode catalog API.
 *
 * @module domains/anime/types/anime-episode
 */
import type {
  animeEpisodeDetailSchema,
  animeEpisodeItemSchema,
} from '@anime/schemas/anime-episode-schema'
import type { z } from 'zod'

/**
 * One episode in a list page (no synopsis).
 *
 * @see {@link animeEpisodesService.getEpisodes}
 */
export type AnimeEpisodeItem = z.infer<typeof animeEpisodeItemSchema>

/**
 * One episode with its synopsis.
 *
 * @see {@link animeEpisodesService.getEpisode}
 */
export type AnimeEpisodeDetail = z.infer<typeof animeEpisodeDetailSchema>
