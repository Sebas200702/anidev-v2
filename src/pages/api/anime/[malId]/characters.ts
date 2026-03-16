import type { APIRoute } from 'astro'
import { animeCharacterService } from '@/domains/anime/services/anime-characters'
import {
  getAnimeCharacterSchema,
  animeCharacterResponseSchema,
} from '@/domains/anime/schemas/anime-character'
import { withZodValidation } from '@/core/http/middlewares/with-zod-validation'
import { mapErrorToHttp } from '@/core/errors/handle-error'

export const GET: APIRoute = withZodValidation(getAnimeCharacterSchema)(async ({
  validated,
}) => {
  try {
    const { malId } = validated.params

    const characters = await animeCharacterService.getAnimeCharacters(malId)

    const payload = {
      data: characters,
      status: 200,
      meta: {
        count: characters.length,
      },
    }
    const responseBody = animeCharacterResponseSchema.parse(payload)
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
