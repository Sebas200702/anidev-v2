/**
 * Zod schemas for search-history API payloads.
 *
 * @module domains/search/schemas/search-history-schema
 */
import { z } from 'zod'
import { createApiResponseSchema } from '@shared/schemas/api-schema'

/**
 * **Query params** for reading recent searches (`GET /api/search-history`).
 */
export const searchHistoryQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

/** A single search-history entry as returned by the API. */
export const searchHistoryEntrySchema = z.object({
  id: z.number().int(),
  scope: z.string(),
  query: z.string().nullable(),
  filters: z.unknown().nullable(),
  createdAt: z.union([z.date(), z.string()]),
})

/**
 * Request validator for `GET /api/search-history` — validates the `limit`
 * query param (params/body are unused but accepted for the wrapper shape).
 */
export const getSearchHistorySchema = z.object({
  params: z.object({}).optional().default({}),
  query: searchHistoryQuerySchema,
  body: z.unknown().optional(),
})

/**
 * Request validator for `DELETE /api/search-history` — no input beyond the
 * authenticated session.
 */
export const deleteSearchHistorySchema = z.object({
  params: z.object({}).optional().default({}),
  query: z.object({}).optional().default({}),
  body: z.unknown().optional(),
})

/** API envelope wrapping the recent-searches list. */
export const searchHistoryListResponseSchema = createApiResponseSchema(
  z.array(searchHistoryEntrySchema)
)

/** API envelope wrapping the clear-history result (`{ removed }`). */
export const searchHistoryClearResponseSchema = createApiResponseSchema(
  z.object({ removed: z.number().int() })
)
