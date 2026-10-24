/**
 * Voice roles of a person.
 *
 * @module pages/api/people/[malId]/voices
 *
 * **Route:** `GET /api/people/:malId/voices` — public.
 *
 * Lists the characters the person voices (one row per language, optional `language`), each with up to 3 of its anime.
 *
 * **Errors:** `400 VALIDATION_ERROR`, `404 PERSON_NOT_FOUND`.
 *
 * @example
 * ```bash
 * curl "http://localhost:4321/api/people/118/voices?language=Japanese"
 * ```
 *
 * @see {@link personService.getVoices}
 */
import { personVoicesRequestSchema } from '@people/schemas/person-schema'
import { personVoicesResponseSchema } from '@people/schemas/person-schema'
import { personService } from '@people/services/person'
import { createPagedPeopleRoute } from '@people/utils/paged-route'

/** Paginated list; see the module docs. */
export const GET = createPagedPeopleRoute(
  personVoicesRequestSchema,
  personVoicesResponseSchema,
  personService.getVoices
)
