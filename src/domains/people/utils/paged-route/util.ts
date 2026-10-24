/**
 * Factory of the paginated people sub-routes (`/:malId/<list>`).
 *
 * @module domains/people/utils/paged-route/util
 * @remarks
 * Voices, credits and music share validation, error handling and the
 * paginated envelope; only the schemas and the loader change.
 */
import type { APIContext, APIRoute } from 'astro'
import type { z } from 'zod'
import type { StaleResult } from '@lib/cache/cache-store-types'
import { withErrorHandling } from '@http/with-error-handling'
import { withZodValidation } from '@http/with-validation'
import { buildPageMeta } from '@shared/http/page-meta-util'

type PagedQuery = { page: number; limit: number }

/**
 * Builds a `GET` route that validates `{ params: { malId }, query }`, loads a
 * page and answers `{ data: list, meta: { page, total, hasNext, stale } }`.
 *
 * @param requestSchema - Zod request schema (`params.malId` + paged query)
 * @param responseSchema - Zod response envelope schema
 * @param load - Loader returning `{ value: { list, total }, isStale }`
 * @returns The Astro route handler
 */
export const createPagedPeopleRoute = <Q extends PagedQuery, T>(
  requestSchema: z.ZodType<{ params: { malId: number }; query: Q }>,
  responseSchema: z.ZodType,
  load: (
    malId: number,
    query: Q
  ) => Promise<StaleResult<{ list: T[]; total: number }>>
): APIRoute =>
  withZodValidation(requestSchema)(
    withErrorHandling(
      async ({
        validated,
      }: APIContext & {
        validated: { params: { malId: number }; query: Q }
      }) => {
        const { params, query } = validated
        const { value, isStale } = await load(params.malId, query)
        return {
          data: value.list,
          status: 200,
          meta: buildPageMeta(query, value.total, isStale),
        }
      },
      { responseSchema }
    )
  )
