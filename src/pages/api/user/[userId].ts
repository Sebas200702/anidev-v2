import type { APIRoute } from 'astro'
import { withZodValidation } from '@/core/http/middlewares/with-zod-validation'
import { userService } from '@/domains/user/services/user'
import { mapErrorToHttp } from '@/core/errors/handle-error'
import {
  getUserProfileSchema,
  userProfileResponseSchema,
} from '@/domains/user/schemas/user'

export const GET: APIRoute = withZodValidation(getUserProfileSchema)(async ({
  locals,
  validated,
}) => {
  try {
    const { userId: targetId } = validated.params
    const { user } = locals
    const userProfile = await userService.getUserProfile({
      userId: user?.id ?? 'anonymous',
      targetId,
    })

    const payload = {
      data: userProfile,
      status: 200,
      meta: {},
    }

    const responseBody = userProfileResponseSchema.parse(payload)

    return new Response(JSON.stringify(responseBody), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    const { status, body } = mapErrorToHttp(error)

    const payload = {
      data: null,
      status,
      error: body.message ?? 'Unexpected error',
      meta: body.meta ?? {},
    }

    return new Response(JSON.stringify(payload), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
