/**
 * Domain types for the printed-media (manga) domain.
 *
 * @module domains/manga/types/manga-api
 */
import type { z } from 'zod'
import type {
  mangaCardSchema,
  mangaFiltersSchema,
  mangaFiltersParamsSchema,
} from '@manga/schemas/manga-schema'
import type {
  mangaCastMemberSchema,
  mangaDetailsSchema,
} from '@manga/schemas/manga-details-schema'
import type { mangaFullDetailsSchema } from '@manga/schemas/manga-full-schema'

/** Compact printed-media summary used in list and grid views. */
export type MangaCard = z.infer<typeof mangaCardSchema>

/** Full printed-media payload for the detail page. */
export type MangaDetails = z.infer<typeof mangaDetailsSchema>

/** Normalized filters used by repositories and cache keys. */
export type MangaFilters = z.infer<typeof mangaFiltersSchema>

/** Raw query parameters as received at the route. */
export type MangaFiltersParams = z.infer<typeof mangaFiltersParamsSchema>

/** A cast member with its voice actors. */
export type MangaCastMember = z.infer<typeof mangaCastMemberSchema>

/** Extended detail payload of `GET /api/manga/:malId/full`. */
export type MangaFullDetails = z.infer<typeof mangaFullDetailsSchema>
