/**
 * Producer list API endpoint.
 *
 * @module pages/api/producers/index
 *
 * **Route:** `GET /api/producers` — public.
 *
 * Studios, producers, licensors and magazines with their credited-work count.
 *
 * @see {@link producerListRequestSchema} — request validation schema
 * @see {@link producerListService.getProducers} — list service
 */
import type { APIContext, APIRoute } from 'astro'
import { withErrorHandling } from '@http/with-error-handling'
import { withZodValidation } from '@http/with-validation'
import {
  producerListRequestSchema,
  producerListResponseSchema,
} from '@producer/schemas/producer-schema'
import { producerListService } from '@producer/services/producer-list'
import type { ProducerListQuery } from '@producer/types'

/**
 * Returns one page of producers.
 *
 * @remarks
 * | Query | Type | Description |
 * |-------|------|-------------|
 * | `page` / `limit` | `number` | Pagination (1–10000 / 1–100, default 20) |
 * | `query` | `string` | Matches any producer title |
 * | `role` | `studio \| producer \| licensor \| serialization` | Only producers credited in that role; `works` counts that role |
 * | `sort` | `works \| name` | Most credited first (default) or by name |
 *
 * **Success:** `{ data: Array<{ malId, name, works }>, status: 200, meta: { page, total, hasNext, stale } }`
 *
 * @example
 * ```bash
 * curl "http://localhost:4321/api/producers?role=studio&limit=10"
 * ```
 */
export const GET: APIRoute = withZodValidation(producerListRequestSchema)(
  withErrorHandling(
    async ({
      validated,
    }: APIContext & { validated: { query: ProducerListQuery } }) => {
      const { query } = validated
      const {
        value: { list, total },
        isStale,
      } = await producerListService.getProducers(query)

      return {
        data: list,
        status: 200,
        meta: {
          stale: isStale,
          page: query.page,
          total,
          hasNext: query.page * query.limit < total,
        },
      }
    },
    { responseSchema: producerListResponseSchema }
  )
)
