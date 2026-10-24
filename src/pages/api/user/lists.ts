import type { APIContext, APIRoute } from 'astro'
import { withErrorHandling } from '@http/with-error-handling'
import { withZodValidation } from '@http/with-validation'
import { requireAuthSession } from '@auth/utils'
import {
  getUserListRequestSchema,
  userListRequestSchema,
  userListDeleteRequestSchema,
  userListResponseSchema,
  userListMutationResponseSchema,
  userListDeleteResponseSchema,
} from '@user/schemas'
import { userListService } from '@user/services'

export const GET: APIRoute = withZodValidation(getUserListRequestSchema)(
  withErrorHandling(
    async ({
      locals,
      validated,
    }: APIContext & {
      validated: { query: { status?: string; isFavorite?: boolean } }
    }) => {
      const userId = requireAuthSession(locals)
      const entries = await userListService.list(userId, validated.query ?? {})
      return {
        data: entries,
        status: 200,
        meta: { count: entries.length },
        headers: new Headers({ 'Cache-Control': 'private, no-store' }),
      }
    },
    { responseSchema: userListResponseSchema }
  )
)

export const PUT: APIRoute = withZodValidation(userListRequestSchema)(
  withErrorHandling(
    async ({
      locals,
      validated,
    }: APIContext & { validated: { body: any } }) => {
      const userId = requireAuthSession(locals)
      const entry = await userListService.upsert(userId, validated.body)
      return {
        data: entry,
        status: 200,
        meta: {},
        headers: new Headers({ 'Cache-Control': 'private, no-store' }),
      }
    },
    { responseSchema: userListMutationResponseSchema }
  )
)

export const DELETE: APIRoute = withZodValidation(userListDeleteRequestSchema)(
  withErrorHandling(
    async ({
      locals,
      validated,
    }: APIContext & { validated: { body: { animeId: number } } }) => {
      const userId = requireAuthSession(locals)
      const snapshot = await userListService.remove(
        userId,
        validated.body.animeId
      )
      return {
        data: snapshot,
        status: 200,
        meta: {},
        headers: new Headers({ 'Cache-Control': 'private, no-store' }),
      }
    },
    { responseSchema: userListMutationResponseSchema }
  )
)
