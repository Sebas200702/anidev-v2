/**
 * Zod schemas for printed-media (manga) API payloads.
 *
 * @module domains/manga/schemas
 */
import { z } from 'zod'
import { createApiResponseSchema } from '@shared/schemas/api-schema'

/** Whitelisted sort fields for the printed-media list. */
export const mangaSortFields = ['score', 'year', 'title'] as const

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
  /** Server-derived producer scope (`/api/producers/:id/manga`; never a client query param). */
  producerId: z.number().int().positive().optional(),
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

/** **Response schema** — `{ data: MangaCard[] }` envelope. */
export const mangaListResponseSchema = createApiResponseSchema(
  z.array(mangaCardSchema)
)
