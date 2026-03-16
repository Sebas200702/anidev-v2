import type { APIRoute } from 'astro'
import { animeStaffService } from '@/domains/anime/services/anime-staff'
import {
  getAnimeStaffSchema,
  animeStaffResponseSchema,
} from '@/domains/anime/schemas/anime-staff'
import { withZodValidation } from '@/core/http/middlewares/with-zod-validation'
import { mapErrorToHttp } from '@/core/errors/handle-error'

export const GET: APIRoute = withZodValidation(getAnimeStaffSchema)(async ({
  validated,
}) => {
  try {
    const { malId } = validated.params

    const staff = await animeStaffService.getAnimeStaff(malId)

    const payload = {
      data: staff,
      status: 200,
      meta: {
        count: staff.length,
      },
    }
    const responseBody = animeStaffResponseSchema.parse(payload)
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
