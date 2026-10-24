/**
 * Request pieces shared by the character and people schemas.
 *
 * @module domains/people/schemas/people-common-schema
 */
import { z } from 'zod'
import { PEOPLE_SEARCH_MIN_LENGTH } from '@people/constants'

/** `page` / `limit` (default 20, max 100). */
export const peoplePagination = {
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
}

/** Paginated name search (`query` required, 2–100 chars). */
export const peopleSearchQuerySchema = z.object({
  ...peoplePagination,
  query: z.string().trim().min(PEOPLE_SEARCH_MIN_LENGTH).max(100),
})

/** `:malId` path parameter. */
export const malIdParamsSchema = z.object({
  malId: z.coerce.number().int().positive(),
})

/** Builds a `{ params, query, body }` request schema. */
export const peopleRequest = <P extends z.ZodType, Q extends z.ZodType>(
  params: P,
  query: Q
) => z.object({ params, query, body: z.unknown().optional() })

/** Request with no params, only a query. */
export const noParams = z.object({}).optional().default({})

/** Request with no query, only params. */
export const noQuery = z.object({}).optional().default({})
