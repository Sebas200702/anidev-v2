import { mapErrorToHttp } from '@/core/errors/handle-error'
import { withZodValidation } from '@/core/http/middlewares/with-zod-validation'
import {
  animeListRequestSchema,
  animeListResponseSchema,
} from '@/domains/anime/schemas/anime-list'
import { animeListService } from '@/domains/anime/services/anime-list'
import type { APIRoute } from 'astro'
export const GET: APIRoute = withZodValidation(animeListRequestSchema)(async ({
  validated,
}) => {
  try {
    const { list: animeCards, total } = await animeListService.getAnimeList(
      validated.query
    )
    const payload = {
      data: animeCards,
      status: 200,
      meta: {
        page: validated.query.page,
        total,
        hasNext: validated.query.page * validated.query.limit < total,
      },
    }
    const responseBody = animeListResponseSchema.parse(payload)
    return new Response(JSON.stringify(responseBody), {
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
