/**
 * Music themes performed by a person.
 *
 * @module pages/api/people/[malId]/music
 *
 * **Route:** `GET /api/people/:malId/music` — public.
 *
 * Lists the OP/ED themes credited to the music artist linked to the person by MAL id; empty when there is no such artist.
 *
 * **Errors:** `400 VALIDATION_ERROR`, `404 PERSON_NOT_FOUND`.
 *
 * @example
 * ```bash
 * curl "http://localhost:4321/api/people/118/music"
 * ```
 *
 * @see {@link personService.getMusic}
 */
import { personMusicRequestSchema } from '@people/schemas/person-schema'
import { musicListResponseSchema } from '@music/schemas/music-list-schema'
import { personService } from '@people/services/person'
import { createPagedPeopleRoute } from '@people/utils/paged-route'

/** Paginated list; see the module docs. */
export const GET = createPagedPeopleRoute(
  personMusicRequestSchema,
  musicListResponseSchema,
  personService.getMusic
)
