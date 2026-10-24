/**
 * Staff credits of a person.
 *
 * @module pages/api/people/[malId]/credits
 *
 * **Route:** `GET /api/people/:malId/credits` — public.
 *
 * Lists the works the person is credited on (`medium=anime|manga`, default anime), one item per work with every position held. `safe` floor applied.
 *
 * **Errors:** `400 VALIDATION_ERROR`, `404 PERSON_NOT_FOUND`.
 *
 * @example
 * ```bash
 * curl "http://localhost:4321/api/people/118/credits?medium=manga"
 * ```
 *
 * @see {@link personService.getCredits}
 */
import {
  personCreditsRequestSchema,
  personCreditsResponseSchema,
} from '@people/schemas/person-schema'
import { personService } from '@people/services/person'
import { createPagedPeopleRoute } from '@people/utils/paged-route'

/** Paginated list; see the module docs. */
export const GET = createPagedPeopleRoute(
  personCreditsRequestSchema,
  personCreditsResponseSchema,
  personService.getCredits
)
