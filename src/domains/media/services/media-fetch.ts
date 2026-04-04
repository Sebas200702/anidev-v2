import { ErrorCodes } from '@/core/errors/error-codes'
import { InfraError } from '@/core/errors/errors'

type FetchMediaOptions = {
  signal?: AbortSignal
  accept?: string
}

export async function fetchMediaAsset(
  mediaUrl: string,
  { signal, accept = '*/*' }: FetchMediaOptions = {}
): Promise<{ buffer: Buffer; mimeType: string }> {
    try {
    const response = await fetch(mediaUrl, {
      signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: accept,
        'Accept-Encoding': 'gzip, deflate, br',
        Referer: 'https://myanimelist.net/',
      },
    })

    if (!response.ok) {
      throw new InfraError(
        ErrorCodes.EXTERNAL_API_ERROR,
        `Failed to fetch media: ${response.statusText}`,
        { status: response.status, url: mediaUrl }
      )
    }

    const contentType =
      response.headers.get('content-type') ?? 'application/octet-stream'
    return {
      buffer: Buffer.from(await response.arrayBuffer()),
      mimeType: contentType.split(';')[0]?.trim() || 'application/octet-stream',
    }
  } catch (error) {
    if (error instanceof InfraError) throw error
    throw new InfraError(ErrorCodes.EXTERNAL_API_ERROR, 'Failed to fetch media', {
      url: mediaUrl,
      cause: error instanceof Error ? error.message : String(error),
    })
  }
}
