/**
 * Printed works linked to a producer (magazines, publishers).
 *
 * @module pages/api/producers/[malId]/manga
 *
 * **Route:** `GET /api/producers/:malId/manga` — public.
 *
 * @see {@link producerWorksService.getManga}
 */
import type { APIContext, APIRoute } from 'astro'
import { withErrorHandling } from '@http/with-error-handling'
import { withZodValidation } from '@http/with-validation'
import { mangaListResponseSchema } from '@manga/schemas/manga-schema'
import { producerMangaRequestSchema } from '@producer/schemas/producer-schema'
import { producerWorksService } from '@producer/services/producer-works'

type Validated = {
  params: { malId: number }
  query: { page: number; limit: number }
}

/**
 * Returns manga cards linked to the producer (`safe` floor applied).
 *
 * @remarks Errors: `400 VALIDATION_ERROR`, `404 PRODUCER_NOT_FOUND`.
 *
 * @example
 * ```bash
 * curl "http://localhost:4321/api/producers/83/manga"
 * ```
 */
export const GET: APIRoute = withZodValidation(producerMangaRequestSchema)(
  withErrorHandling(
    async ({ validated }: APIContext & { validated: Validated }) => {
      const { params, query } = validated
      const {
        value: { list, total },
        isStale,
      } = await producerWorksService.getManga(params.malId, query)

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
    { responseSchema: mangaListResponseSchema }
  )
)
