/**
 * @module @domains/media/services/media-fetch-service
 * @remarks Fetches remote media assets over HTTP with browser-like headers for upstream CDN
 * compatibility. Used by {@link mediaService.fetchImageBuffer} in the optimization pipeline.
 */
import { ErrorCodes } from '@shared/errors/codes'
import { InfraError } from '@shared/errors/app-error'

type FetchMediaOptions = {
  signal?: AbortSignal
  accept?: string
}

type FetchedMediaAsset = {
  buffer: Buffer
  mimeType: string
}

/**
 * Downloads a remote media resource and returns its bytes and MIME type.
 *
 * @remarks Sends a Chrome user agent, gzip/br accept-encoding, and a MyAnimeList referer to
 * maximize compatibility with anime CDN hosts. Non-success HTTP statuses and network failures
 * are wrapped in {@link InfraError} with {@link ErrorCodes.EXTERNAL_API_ERROR}.
 * @param mediaUrl - Absolute URL of the remote asset
 * @param options - Optional abort signal and Accept header override
 * @returns Downloaded buffer and normalized MIME type (parameters stripped from Content-Type)
 * @throws {InfraError} When the remote request fails or returns a non-success status
 * @see {@link mediaService.fetchImageBuffer} for image-specific validation after fetch
 * @example
 * ```typescript
 * const { buffer, mimeType } = await fetchMediaAsset('https://cdn.myanimelist.net/image.jpg', {
 *   accept: 'image/webp,image/*',
 * })
 * ```
 */
export async function fetchMediaAsset(
  mediaUrl: string,
  { signal, accept = '*/*' }: FetchMediaOptions = {}
): Promise<FetchedMediaAsset> {
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
