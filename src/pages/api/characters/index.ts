/**
 * Character search API endpoint.
 *
 * @module pages/api/characters/index
 *
 * **Route:** `GET /api/characters?query=` — public.
 *
 * @see {@link characterService.search}
 */
import type { APIContext, APIRoute } from 'astro'
import { withErrorHandling } from '@http/with-error-handling'
import { withZodValidation } from '@http/with-validation'
import {
  characterSearchRequestSchema,
  characterSearchResponseSchema,
} from '@people/schemas/character-schema'
import { characterService } from '@people/services/character'
import type { PeopleSearchQuery } from '@people/types'
import { buildPageMeta } from '@shared/http/page-meta-util'

/**
 * Searches characters by name (2–100 chars), most favorited first.
 *
 * @remarks
 * **Success:** `{ data: Array<{ malId, name, nameKanji, imageUrl, favorites }>, meta: { page, total, hasNext, stale } }`
 *
 * **Errors:** `400 VALIDATION_ERROR` (missing or short `query`).
 *
 * @example
 * ```bash
 * curl "http://localhost:4321/api/characters?query=lelouch"
 * ```
 */
export const GET: APIRoute = withZodValidation(characterSearchRequestSchema)(
  withErrorHandling(
    async ({
      validated,
    }: APIContext & { validated: { query: PeopleSearchQuery } }) => {
      const { query } = validated
      const { value, isStale } = await characterService.search(query)
      return {
        data: value.list,
        status: 200,
        meta: buildPageMeta(query, value.total, isStale),
      }
    },
    { responseSchema: characterSearchResponseSchema }
  )
)
