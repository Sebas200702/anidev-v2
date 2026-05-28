import { mapErrorToHttp } from '@/core/errors/handle-error'
import { withZodValidation } from '@/core/http/middlewares/with-zod-validation'
import { mediaRequestSchema } from '@/domains/media/schemas/media-schema'
import { mediaService } from '@/domains/media/services/media'
import type { APIRoute } from 'astro'
export const GET: APIRoute = withZodValidation(mediaRequestSchema)(async ({
  validated,
}) => {
  try {
    const parsed = mediaService.parsePath(validated.params.path)

    const width = validated.query.w
    const quality = validated.query.q
    const source = validated.query.source
    const optimizedImage = await mediaService.optimizeMedia(parsed, {
      width,
      quality,
      source,
    })
    return new Response(new Uint8Array(optimizedImage.buffer), {
      headers: {
        'Content-Type': optimizedImage.mimeType,
      },
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
