/**
 * @module domains/media/services/media-fetch/service
 * @remarks Fetches remote media assets over HTTP with browser-like headers for upstream CDN
 * compatibility. Used by {@link mediaService.fetchImageBuffer} in the optimization pipeline.
 */
import { ErrorCodes } from '@shared/errors/codes'
import { DomainError, InfraError } from '@shared/errors/app-error'
import { assertSafeExternalUrl } from '@shared/utils/safe-external-url'
import type { FetchMediaOptions, FetchedMediaAsset } from './types'

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
export const fetchMediaAsset = async (
  mediaUrl: string,
  { signal, accept = '*/*' }: FetchMediaOptions = {}
): Promise<FetchedMediaAsset> => {
  const MAX_BYTES = 25 * 1024 * 1024
  assertSafeExternalUrl(mediaUrl)
  try {
    const response = await fetch(mediaUrl, {
      signal: signal ?? AbortSignal.timeout(8000),
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

    assertSafeExternalUrl(response.url || mediaUrl)

    const arrayBuffer = await response.arrayBuffer()
    if (arrayBuffer.byteLength > MAX_BYTES) {
      throw new InfraError(
        ErrorCodes.EXTERNAL_API_ERROR,
        'Media payload exceeds byte budget',
        { url: mediaUrl, size: arrayBuffer.byteLength }
      )
    }

    const contentType =
      response.headers.get('content-type') ?? 'application/octet-stream'

    return {
      buffer: Buffer.from(arrayBuffer),
      mimeType: contentType.split(';')[0]?.trim() || 'application/octet-stream',
    }
  } catch (error) {
    if (error instanceof InfraError) throw error
    if (error instanceof DomainError) throw error

    throw new InfraError(
      ErrorCodes.EXTERNAL_API_ERROR,
      'Failed to fetch media',
      {
        url: mediaUrl,
        cause: error instanceof Error ? error.message : String(error),
      }
    )
  }
}
