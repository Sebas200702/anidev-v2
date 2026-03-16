import type { APIRoute } from 'astro'
import { withZodValidation } from '@/core/http/middlewares/with-zod-validation'
import { animeService } from '@/domains/anime/services/anime'
import { mapErrorToHttp } from '@/core/errors/handle-error'
import {
  animeDetailsResponseSchema,
  getAnimeDetailsSchema,
} from '@/domains/anime/schemas/anime-details'

export const GET: APIRoute = withZodValidation(getAnimeDetailsSchema)(async ({
  validated,
}) => {
  try {
    const { malId } = validated.params

    const anime = await animeService.getAnimeDetails(malId)

    const payload = {
      data: anime,
      status: 200,
      meta: {},
    }

    const responseBody = animeDetailsResponseSchema.parse(payload)

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
