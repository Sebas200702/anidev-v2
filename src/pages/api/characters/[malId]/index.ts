/**
 * Character profile API endpoint.
 *
 * @module pages/api/characters/[malId]/index
 *
 * **Route:** `GET /api/characters/:malId` — public.
 *
 * @see {@link characterService.getProfile}
 */
import type { APIContext, APIRoute } from 'astro'
import { withErrorHandling } from '@http/with-error-handling'
import { withZodValidation } from '@http/with-validation'
import {
  characterProfileResponseSchema,
  getCharacterSchema,
} from '@people/schemas/character-schema'
import { characterService } from '@people/services/character'

/**
 * Returns a character profile with its voice actors grouped by language.
 *
 * @remarks
 * **Errors:** `400 VALIDATION_ERROR`, `404 CHARACTER_NOT_FOUND` (missing or
 * provisional name).
 *
 * @example
 * ```bash
 * curl "http://localhost:4321/api/characters/417"
 * ```
 */
export const GET: APIRoute = withZodValidation(getCharacterSchema)(
  withErrorHandling(
    async ({
      validated,
    }: APIContext & { validated: { params: { malId: number } } }) => {
      const { value, isStale } = await characterService.getProfile(
        validated.params.malId
      )
      return { data: value, status: 200, meta: { stale: isStale } }
    },
    { responseSchema: characterProfileResponseSchema }
  )
)
