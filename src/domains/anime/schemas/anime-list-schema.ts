/**
 * Zod schemas for anime list and filter API payloads.
 *
 * @module domains/anime/schemas/anime-list-schema
 */
import { createApiResponseSchema } from '@shared/schemas/api-schema'
import { animeCardSchema } from '@anime/schemas/anime-card-schema'
import { z } from 'zod'

/**
 * **Request query schema** — raw query parameters for anime list requests.
 *
 * @remarks
 * | Field | Validation |
 * |-------|------------|
 * | `page` | `z.coerce.number().int().min(1).default(1)` |
 * | `limit` | `z.coerce.number().int().min(1).max(100).default(10)` |
 * | `genre` | optional string (comma-separated at route; normalized to array in mapper) |
 * | `status` | optional string |
 * | `rating` | optional string |
 * | `year` | `z.coerce.number().int().min(1900).max(current year).optional()` |
 * | `type` | optional string |
 * | `query` | optional search string |
 * | `season` | optional string |
 * | `scoreMin` / `scoreMax` | `z.coerce.number().min(0).max(10).optional()` |
 * | `sort` | optional enum `score \| year \| title \| relevance` |
 * | `order` | optional enum `asc \| desc` |
 */
const scoreBoundSchema = z.coerce.number().min(0).max(10)

/**
 * Whitelisted sort fields — never interpolate raw input into SQL.
 */
export const animeSortFields = ['score', 'year', 'title', 'relevance'] as const

/** Whitelisted sort field union derived from {@link animeSortFields}. */
export type AnimeSortField = (typeof animeSortFields)[number]

/**
 * Parental-control cache variant: `safe` excludes adult ratings (default,
 * fail-closed), `full` includes them for an opted-in user. Server-derived —
 * never a client query param.
 */
export type ParentalVariant = 'safe' | 'full'

export const animeFiltersParamsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  genre: z.string().optional(),
  status: z.string().optional(),
  rating: z.string().optional(),
  year: z.coerce
    .number()
    .int()
    .min(1900)
    .max(new Date().getFullYear())
    .optional(),
  type: z.string().optional(),
  query: z.string().optional(),
  season: z.string().optional(),
  scoreMin: scoreBoundSchema.optional(),
  scoreMax: scoreBoundSchema.optional(),
  sort: z.enum(animeSortFields).optional(),
  order: z.enum(['asc', 'desc']).optional(),
})

/**
 * **Normalized filters** — after {@link mapAnimeFilters}; used by repos and cache keys.
 *
 * @remarks
 * Extends params schema with `genre` / `status` / `rating` / `type` as `string[]`.
 */
export const animeFiltersSchema = animeFiltersParamsSchema.extend({
  genre: z.array(z.string()).optional(),
  status: z.array(z.string()).optional(),
  rating: z.array(z.string()).optional(),
  type: z.array(z.string()).optional(),
  // Server-derived parental variant (not a client query param); folded into the
  // cache key so `safe` and `full` results never mix.
  parentalVariant: z.enum(['safe', 'full']).optional(),
})

/**
 * Boundary refinements applied to the raw query at the request edge:
 * - `scoreMin` MUST be ≤ `scoreMax` when both are present.
 * - `relevance` sort requires a non-empty (post-trim) `query`.
 *
 * @remarks
 * Kept off {@link animeFiltersParamsSchema} so that schema stays a plain
 * `ZodObject` extendable by {@link animeFiltersSchema}.
 */
const refinedFiltersQuerySchema = animeFiltersParamsSchema.superRefine(
  (value, ctx) => {
    if (
      value.scoreMin !== undefined &&
      value.scoreMax !== undefined &&
      value.scoreMin > value.scoreMax
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['scoreMin'],
        message: 'scoreMin must be less than or equal to scoreMax',
      })
    }
    if (value.sort === 'relevance' && !value.query?.trim()) {
      ctx.addIssue({
        code: 'custom',
        path: ['sort'],
        message: 'relevance sort requires a non-empty query',
      })
    }
  }
)

/**
 * **Full request schema** for `GET /api/anime` (list).
 */
export const animeListRequestSchema = z.object({
  params: z.object({}).optional().default({}),
  query: refinedFiltersQuerySchema,
  body: z.unknown().optional(),
})

/**
 * **Response schema** — paginated cards (total count returned separately by route).
 */
export const animeListResponseSchema = createApiResponseSchema(
  z.array(animeCardSchema)
)
