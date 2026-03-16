import type { APIRoute } from 'astro'
import { withZodValidation } from '@/core/http/middlewares/with-zod-validation'
import { animeFullService } from '@/domains/anime/services/anime-full'
import { mapErrorToHttp } from '@/core/errors/handle-error'
import {
  animeFullDetailsResponseSchema,
  getAnimeFullSchema,
} from '@/domains/anime/schemas/anime-full'

export const GET: APIRoute = withZodValidation(getAnimeFullSchema)(async ({
  validated,
}) => {
  try {
    const { malId } = validated.params

    const anime = await animeFullService.getAnimeFullByMalId(malId)

    const payload = {
      data: anime,
      status: 200,
      meta: {},
    }

    const responseBody = animeFullDetailsResponseSchema.parse(payload)

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
