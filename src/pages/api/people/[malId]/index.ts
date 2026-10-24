/**
 * Person profile API endpoint.
 *
 * @module pages/api/people/[malId]/index
 *
 * **Route:** `GET /api/people/:malId` — public.
 *
 * @see {@link personService.getProfile}
 */
import type { APIContext, APIRoute } from 'astro'
import { withErrorHandling } from '@http/with-error-handling'
import { withZodValidation } from '@http/with-validation'
import {
  getPersonSchema,
  personProfileResponseSchema,
} from '@people/schemas/person-schema'
import { personService } from '@people/services/person'

/**
 * Returns a person with `counts` of voice roles, anime/manga credits and
 * music themes (each equals the `total` of its list endpoint).
 *
 * @remarks **Errors:** `400 VALIDATION_ERROR`, `404 PERSON_NOT_FOUND`.
 *
 * @example
 * ```bash
 * curl "http://localhost:4321/api/people/118"
 * ```
 */
export const GET: APIRoute = withZodValidation(getPersonSchema)(
  withErrorHandling(
    async ({
      validated,
    }: APIContext & { validated: { params: { malId: number } } }) => {
      const { value, isStale } = await personService.getProfile(
        validated.params.malId
      )
      return { data: value, status: 200, meta: { stale: isStale } }
    },
    { responseSchema: personProfileResponseSchema }
  )
)
