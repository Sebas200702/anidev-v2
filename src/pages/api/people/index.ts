/**
 * People search API endpoint.
 *
 * @module pages/api/people/index
 *
 * **Route:** `GET /api/people?query=` — public.
 *
 * @see {@link personService.search}
 */
import type { APIContext, APIRoute } from 'astro'
import { withErrorHandling } from '@http/with-error-handling'
import { withZodValidation } from '@http/with-validation'
import {
  personSearchRequestSchema,
  personSearchResponseSchema,
} from '@people/schemas/person-schema'
import { personService } from '@people/services/person'
import type { PeopleSearchQuery } from '@people/types'
import { buildPageMeta } from '@shared/http/page-meta-util'

/**
 * Searches people (staff, voice actors, authors) by name, most favorited first.
 *
 * @remarks **Errors:** `400 VALIDATION_ERROR` (missing or short `query`).
 *
 * @example
 * ```bash
 * curl "http://localhost:4321/api/people?query=kanno"
 * ```
 */
export const GET: APIRoute = withZodValidation(personSearchRequestSchema)(
  withErrorHandling(
    async ({
      validated,
    }: APIContext & { validated: { query: PeopleSearchQuery } }) => {
      const { query } = validated
      const { value, isStale } = await personService.search(query)
      return {
        data: value.list,
        status: 200,
        meta: buildPageMeta(query, value.total, isStale),
      }
    },
    { responseSchema: personSearchResponseSchema }
  )
)
