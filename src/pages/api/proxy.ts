import type { APIRoute } from 'astro'
import { ImageProxyService } from '@/services/image-service'
import { ErrorCodes } from '@/core/errors/error-codes'
import { ValidationError } from '@/core/errors/errors'
import { mapErrorToHttp } from '@/core/errors/handle-error'
import { z } from 'zod'

const querySchema = z.object({
  url: z.url(),
  w: z.string().optional(),
  q: z.string().optional(),
  fm: z.enum(['avif', 'webp']).optional(),
})

export const GET: APIRoute = async ({ url }) => {
  try {
    const parseResult = querySchema.safeParse({
      url: url.searchParams.get('url') ?? undefined,
      w: url.searchParams.get('w') ?? undefined,
      q: url.searchParams.get('q') ?? undefined,
      fm:
        url.searchParams.get('fm') ??
        url.searchParams.get('format') ??
        undefined,
    })

    if (!parseResult.success) {
      throw new ValidationError(
        ErrorCodes.VALIDATION_ERROR,
        'Invalid query parameters',
        { errors: parseResult.error }
      )
    }

    const {
      url: imageUrl,
      w: widthParam,
      q: qualityParam,
      fm: formatParam,
    } = parseResult.data

    const width = widthParam ? Number(widthParam) : undefined
    const quality = qualityParam ? Number(qualityParam) : undefined
    const format =
      formatParam === 'avif' || formatParam === 'webp' ? formatParam : 'webp'

    const { buffer, mimeType } = await ImageProxyService.fetchAndOptimize(
      imageUrl ?? '',
      { width, quality, format }
    )

    const body = new Uint8Array(buffer)

    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=86400', 
      },
    })
  } catch (error) {
    const { status, body } = mapErrorToHttp(error)
    return new Response(JSON.stringify(body), {
      status,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }
}
