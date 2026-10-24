/**
 * Producer detail API endpoint.
 *
 * @module pages/api/producers/[malId]/index
 *
 * **Route:** `GET /api/producers/:malId` — public.
 *
 * @see {@link producerDetailsService.getProducerDetails} — detail service
 */
import type { APIContext, APIRoute } from 'astro'
import { withErrorHandling } from '@http/with-error-handling'
import { withZodValidation } from '@http/with-validation'
import {
  getProducerSchema,
  producerDetailsResponseSchema,
} from '@producer/schemas/producer-schema'
import { producerDetailsService } from '@producer/services/producer-details'

/**
 * Returns a producer with every title and its credit count per role.
 *
 * @remarks
 * **Success:** `{ data: { malId, name, titles, established, about, counts: { studio, producer, licensor, serialization } } }`
 *
 * **Errors:** `400 VALIDATION_ERROR` (bad id), `404 PRODUCER_NOT_FOUND`.
 *
 * @example
 * ```bash
 * curl "http://localhost:4321/api/producers/14"
 * ```
 */
export const GET: APIRoute = withZodValidation(getProducerSchema)(
  withErrorHandling(
    async ({
      validated,
    }: APIContext & { validated: { params: { malId: number } } }) => {
      const { value, isStale } =
        await producerDetailsService.getProducerDetails(validated.params.malId)

      return { data: value, status: 200, meta: { stale: isStale } }
    },
    { responseSchema: producerDetailsResponseSchema }
  )
)
