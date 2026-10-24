import type { APIContext, APIRoute } from 'astro'
import { withErrorHandling } from '@http/with-error-handling'
import { withZodValidation } from '@http/with-validation'
import { requireAuthSession } from '@auth/utils'
import {
  getWatchProgressRequestSchema,
  putWatchProgressRequestSchema,
  watchProgressResponseSchema,
  watchProgressMutationResponseSchema,
} from '@user/schemas'
import { watchProgressService } from '@user/services'

export const GET: APIRoute = withZodValidation(getWatchProgressRequestSchema)(
  withErrorHandling(
    async ({
      locals,
      validated,
    }: APIContext & {
      validated: { query: { animeId?: number } }
    }) => {
      const userId = requireAuthSession(locals)
      const entries = await watchProgressService.list(
        userId,
        validated.query?.animeId
      )
      return {
        data: entries,
        status: 200,
        meta: { count: entries.length },
        headers: new Headers({ 'Cache-Control': 'private, no-store' }),
      }
    },
    { responseSchema: watchProgressResponseSchema }
  )
)

export const PUT: APIRoute = withZodValidation(putWatchProgressRequestSchema)(
  withErrorHandling(
    async ({
      locals,
      validated,
    }: APIContext & { validated: { body: any } }) => {
      const userId = requireAuthSession(locals)
      const entry = await watchProgressService.upsert(userId, validated.body)
      return {
        data: entry,
        status: 200,
        meta: {},
        headers: new Headers({ 'Cache-Control': 'private, no-store' }),
      }
    },
    { responseSchema: watchProgressMutationResponseSchema }
  )
)
