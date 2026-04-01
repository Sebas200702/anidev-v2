import {
  animeFiltersParamsSchema,
  animeFiltersSchema,
  animeListResponseSchema,
} from '@/domains/anime/schemas/anime-list'
import { z } from 'zod'
export type AnimeFilters = z.infer<typeof animeFiltersSchema>
export type AnimeFiltersParams = z.infer<typeof animeFiltersParamsSchema>
export type AnimeListResponse = z.infer<typeof animeListResponseSchema>
