/**
 * Zod schemas for the catalog search endpoint (`GET /api/search`).
 *
 * @module domains/search/schemas/catalog-search-schema
 */
import { z } from 'zod'
import { animeCardSchema } from '@anime/schemas/anime-card-schema'
import { mangaCardSchema } from '@manga/schemas/manga-schema'
import { musicCardSchema } from '@music/schemas/music-card-schema'
import { characterCardSchema } from '@people/schemas/character-schema'
import { PEOPLE_SEARCH_MIN_LENGTH } from '@people/constants'
import { createApiResponseSchema } from '@shared/schemas/api-schema'
import { CATALOG_SEARCH_TYPES } from '@search/constants'

/**
 * **Request query schema** — catalog search parameters.
 *
 * @remarks
 * | Field | Validation |
 * |-------|------------|
 * | `q` | trimmed string, 1–100 chars (2+ for `characters`) |
 * | `type` | `anime \| manga \| music \| characters`, default `anime` |
 * | `page` | `z.coerce.number().int().min(1).max(10_000).default(1)` |
 * | `limit` | `z.coerce.number().int().min(1).max(100).default(10)` |
 */
export const catalogSearchQuerySchema = z
  .object({
    q: z.string().trim().min(1).max(100),
    type: z.enum(CATALOG_SEARCH_TYPES).default('anime'),
    page: z.coerce.number().int().min(1).max(10_000).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
  })
  .refine(
    ({ q, type }) =>
      type !== 'characters' || q.length >= PEOPLE_SEARCH_MIN_LENGTH,
    {
      path: ['q'],
      message: `Character search needs at least ${PEOPLE_SEARCH_MIN_LENGTH} characters`,
    }
  )

/** **Request schema** for `GET /api/search`. */
export const catalogSearchRequestSchema = z.object({
  params: z.object({}).optional().default({}),
  query: catalogSearchQuerySchema,
  body: z.unknown().optional(),
})

/** **Response schema** — cards of the searched catalog. */
export const catalogSearchResponseSchema = createApiResponseSchema(
  z.union([
    z.array(animeCardSchema),
    z.array(mangaCardSchema),
    z.array(musicCardSchema),
    z.array(characterCardSchema),
  ])
)
