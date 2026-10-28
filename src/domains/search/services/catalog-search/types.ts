/**
 * Types of the catalog search service.
 *
 * @module domains/search/services/catalog-search/types
 */
import type { z } from 'zod'
import type { AnimeCard } from '@anime/types'
import type { MangaCard } from '@manga/types'
import type { catalogSearchQuerySchema } from '@search/schemas/catalog-search-schema'

/** Validated catalog search parameters. */
export type CatalogSearchQuery = z.infer<typeof catalogSearchQuerySchema>

/** One page of results of the searched catalog. */
export type CatalogSearchResult =
  | { type: 'anime'; list: AnimeCard[]; total: number }
  | { type: 'manga'; list: MangaCard[]; total: number }
