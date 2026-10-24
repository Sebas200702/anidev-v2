/**
 * Anime credited to a producer.
 *
 * @module pages/api/producers/[malId]/anime
 *
 * **Route:** `GET /api/producers/:malId/anime?role=` — public.
 *
 * @see {@link producerWorksService.getAnime}
 */
import type { APIContext, APIRoute } from 'astro'
import type { ANIME_PRODUCER_ROLES } from '@anime/constants'
import { animeListResponseSchema } from '@anime/schemas/anime-list-schema'
import { withErrorHandling } from '@http/with-error-handling'
import { withZodValidation } from '@http/with-validation'
import { producerAnimeRequestSchema } from '@producer/schemas/producer-schema'
import { producerWorksService } from '@producer/services/producer-works'

type Validated = {
  params: { malId: number }
  query: {
    page: number
    limit: number
    role?: (typeof ANIME_PRODUCER_ROLES)[number]
  }
}

/**
 * Returns anime cards credited to the producer (`safe` floor applied).
 *
 * @remarks
 * `role` (`studio | producer | licensor`) keeps only that credit. Errors:
 * `400 VALIDATION_ERROR`, `404 PRODUCER_NOT_FOUND`.
 *
 * @example
 * ```bash
 * curl "http://localhost:4321/api/producers/14/anime?role=studio"
 * ```
 */
export const GET: APIRoute = withZodValidation(producerAnimeRequestSchema)(
  withErrorHandling(
    async ({ validated }: APIContext & { validated: Validated }) => {
      const { params, query } = validated
      const {
        value: { list, total },
        isStale,
      } = await producerWorksService.getAnime(params.malId, query)

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
    { responseSchema: animeListResponseSchema }
  )
)
