/**
 * Domain types for anime list and filter payloads.
 *
 * @module domains/anime/types/anime-list
 */
import {
  animeFiltersParamsSchema,
  animeFiltersSchema,
  animeListResponseSchema,
} from '@domains/anime/schemas/anime-list-schema'
import { z } from 'zod'

/**
 * Normalized list filters used by repositories and cache keys.
 *
 * @remarks
 * Facet fields (`genre`, `status`, …) are `string[]` after {@link mapAnimeFilters}.
 *
 * @see {@link animeListRepository}
 * @see {@link animeListCache}
 */
export type AnimeFilters = z.infer<typeof animeFiltersSchema>

/**
 * Raw query parameters for anime list requests (pre-mapper).
 *
 * @see {@link animeFiltersParamsSchema}
 */
export type AnimeFiltersParams = z.infer<typeof animeFiltersParamsSchema>

/**
 * API response wrapping a paginated anime card array.
 */
export type AnimeListResponse = z.infer<typeof animeListResponseSchema>
