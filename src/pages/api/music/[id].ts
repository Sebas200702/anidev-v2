import type { APIRoute } from 'astro'
import { withZodValidation } from '@/core/http/middlewares/with-zod-validation'
import { musicService } from '@/domains/music/services/music'
import { mapErrorToHttp } from '@/core/errors/handle-error'
import {
  getMusicSchema,
  musicDetailsResponseSchema,
} from '@/domains/music/schemas/api'

export const GET: APIRoute = withZodValidation(getMusicSchema)(async ({
  validated,
}) => {
  try {
    const { id } = validated.params
    const musicDetails = await musicService.getMusicDetailsById(Number(id))

    const payload = {
      data: musicDetails,
      status: 200,
      meta: {},
    }
    const responseBody = musicDetailsResponseSchema.parse(payload)

    return new Response(JSON.stringify(responseBody), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    const { body, status } = mapErrorToHttp(error)
    const payload = {
      data: null,
      status,
      error: body.message ?? 'Unexpected error',
      meta: body.meta ?? {},
    }
    return new Response(JSON.stringify(payload), {
      status: status,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
