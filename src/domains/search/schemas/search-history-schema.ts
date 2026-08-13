/**
 * Zod schemas for search-history API payloads.
 *
 * @module domains/search/schemas/search-history-schema
 */
import { z } from 'zod'

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
