/**
 * Character appearances API endpoint.
 *
 * @module pages/api/characters/[malId]/appearances
 *
 * **Route:** `GET /api/characters/:malId/appearances` — public.
 *
 * @see {@link characterService.getAppearances}
 */
import type { APIContext, APIRoute } from 'astro'
import { withErrorHandling } from '@http/with-error-handling'
import { withZodValidation } from '@http/with-validation'
import {
  characterAppearancesRequestSchema,
  characterAppearancesResponseSchema,
} from '@people/schemas/character-schema'
import { characterService } from '@people/services/character'
import type { PeoplePage } from '@people/types'
import { buildPageMeta } from '@shared/http/page-meta-util'

type Validated = { params: { malId: number }; query: PeoplePage }

/**
 * Lists the anime and manga where the character appears (`safe` floor),
 * main roles first.
 *
 * @remarks
 * **Item:** `{ medium: 'anime' | 'manga', malId, title, role: 'main' | 'supporting' | 'background', imageUrl }`
 *
 * **Errors:** `400 VALIDATION_ERROR`, `404 CHARACTER_NOT_FOUND`.
 *
 * @example
 * ```bash
 * curl "http://localhost:4321/api/characters/417/appearances?page=1"
 * ```
 */
export const GET: APIRoute = withZodValidation(
  characterAppearancesRequestSchema
)(
  withErrorHandling(
    async ({ validated }: APIContext & { validated: Validated }) => {
      const { params, query } = validated
      const { value, isStale } = await characterService.getAppearances(
        params.malId,
        query
      )
      return {
        data: value.list,
        status: 200,
        meta: buildPageMeta(query, value.total, isStale),
      }
    },
    { responseSchema: characterAppearancesResponseSchema }
  )
)
