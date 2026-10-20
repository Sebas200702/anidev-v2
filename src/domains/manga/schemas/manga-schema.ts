/**
 * Zod schemas for printed-media (manga) API payloads.
 *
 * @module domains/manga/schemas
 */
import { z } from 'zod'
import { createApiResponseSchema } from '@shared/schemas/api-schema'

/** Whitelisted sort fields for the printed-media list. */
export const mangaSortFields = ['score', 'year', 'title', 'relevance'] as const

/**
 * Validates a compact printed-media card shown in list and grid views.
 *
 * @remarks
 * | Field | Rule |
 * |-------|------|
 * | `malId` | `z.number()` |
 * | `title` | `z.string()` |
 * | `type` | `z.string()` — `manga`, `novel`, `one_shot`, … |
 * | `year` | `z.number()` |
 * | `status` | `z.string()` |
 * | `score` | `z.number().nullable()` |
 * | `chapters` | `z.number().nullable()` |
 * | `imageUrl` / `smallImageUrl` | `z.url()` |
 */
export const mangaCardSchema = z.object({
  malId: z.number(),
  title: z.string(),
  type: z.string(),
  year: z.number(),
  status: z.string(),
  score: z.number().nullable(),
  chapters: z.number().nullable(),
  imageUrl: z.url(),
  smallImageUrl: z.url(),
  altImageText: z.string(),
})

/**
 * Validates the printed-media detail payload.
 *
 * @remarks
 * Taxonomy is exposed as arrays of names; the cast and the staff carry their
 * role so the page can group them without another round-trip.
 */
export const mangaDetailsSchema = z.object({
  malId: z.number(),
  title: z.string(),
  titleEnglish: z.string().nullable(),
  titleJapanese: z.string().nullable(),
  type: z.string(),
  status: z.string(),
  year: z.number(),
  chapters: z.number().nullable(),
  volumes: z.number().nullable(),
  score: z.number().nullable(),
  synopsis: z.string(),
  background: z.string(),
  serialization: z.string().nullable(),
  countryOfOrigin: z.string().nullable(),
  publishedFrom: z.string().nullable(),
  publishedTo: z.string().nullable(),
  genres: z.array(z.string()),
  themes: z.array(z.string()),
  demographics: z.array(z.string()),
  imageUrl: z.url(),
  smallImageUrl: z.url(),
  bannerImageUrl: z.url(),
  characters: z.array(
    z.object({
      characterId: z.number(),
      name: z.string(),
      role: z.string(),
      imageUrl: z.url(),
    })
  ),
  staff: z.array(
    z.object({
      staffId: z.number(),
      name: z.string(),
      role: z.string(),
      imageUrl: z.url(),
    })
  ),
  publishers: z.array(
    z.object({
      producerId: z.number(),
      name: z.string(),
      role: z.string(),
    })
  ),
  related: z.array(
    z.object({
      mangaId: z.number(),
      title: z.string(),
      relationType: z.string(),
    })
  ),
  externalLinks: z.array(
    z.object({
      site: z.string(),
      url: z.url(),
      type: z.string().nullable(),
    })
  ),
  slug: z.string(),
  url: z.url(),
  altImageText: z.string(),
})

/**
 * **Request query schema** — raw query parameters for printed-media lists.
 *
 * @remarks
 * | Field | Validation |
 * |-------|------------|
 * | `page` | `z.coerce.number().int().min(1).max(10_000).default(1)` |
 * | `limit` | `z.coerce.number().int().min(1).max(100).default(10)` |
 * | `type` | optional string (`manga`, `novel`, `one_shot`, …) |
 * | `genre` / `theme` / `demographic` | optional string |
 * | `status` | optional string |
 * | `year` | `z.coerce.number().int().min(1900).max(current year).optional()` |
 * | `query` | optional free-text search term |
 * | `scoreMin` / `scoreMax` | `z.coerce.number().min(0).max(10).optional()` |
 * | `sort` | optional enum `score \| year \| title \| relevance` |
 * | `order` | optional enum `asc \| desc` |
 */
const scoreBoundSchema = z.coerce.number().min(0).max(10)

export const mangaFiltersParamsSchema = z.object({
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  type: z.string().optional(),
  genre: z.string().optional(),
  theme: z.string().optional(),
  demographic: z.string().optional(),
  status: z.string().optional(),
  year: z.coerce
    .number()
    .int()
    .min(1900)
    .max(new Date().getFullYear())
    .optional(),
  query: z.string().optional(),
  scoreMin: scoreBoundSchema.optional(),
  scoreMax: scoreBoundSchema.optional(),
  sort: z.enum(mangaSortFields).optional(),
  order: z.enum(['asc', 'desc']).optional(),
})

/**
 * **Normalized filters** — after mapping; used by repositories and cache keys.
 */
export const mangaFiltersSchema = mangaFiltersParamsSchema.extend({
  type: z.array(z.string()).optional(),
  genre: z.array(z.string()).optional(),
  theme: z.array(z.string()).optional(),
  demographic: z.array(z.string()).optional(),
  status: z.array(z.string()).optional(),
  /** Server-derived parental variant (never a client query param). */
  parentalVariant: z.enum(['safe', 'full']).optional(),
})

/**
 * **Request schema** for printed-media list routes (`GET /api/manga`).
 *
 * @remarks Mirrors the anime list schema: the query is validated with the
 * filter params and the route receives `validated.query`.
 */
export const mangaListRequestSchema = z.object({
  params: z.object({}).optional().default({}),
  query: mangaFiltersParamsSchema,
  body: z.unknown().optional(),
})

/**
 * **Request schema** for printed-media detail routes (`GET /api/manga/:malId`).
 */
export const getMangaDetailsSchema = z.object({
  params: z.object({
    malId: z.coerce.number().int().positive(),
  }),
  query: z.object({}).optional().default({}),
  body: z.unknown().optional(),
})

/** **Response schema** — `{ data: MangaCard[] }` envelope. */
export const mangaListResponseSchema = createApiResponseSchema(
  z.array(mangaCardSchema)
)

/** **Response schema** — `{ data: MangaDetails }` envelope. */
export const mangaDetailsResponseSchema =
  createApiResponseSchema(mangaDetailsSchema)
