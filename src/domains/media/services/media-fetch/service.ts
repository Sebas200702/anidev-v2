/**
 * @module domains/media/services/media-fetch/service
 * @remarks Fetches remote media assets over HTTP with browser-like headers for upstream CDN
 * compatibility. Used by {@link mediaService.fetchImageBuffer} in the optimization pipeline.
 */
import { ErrorCodes } from '@shared/errors/codes'
import { DomainError, InfraError } from '@shared/errors/app-error'
import { assertSafeExternalUrl } from '@shared/utils/safe-external-url'
import type {
  FetchMediaOptions,
  FetchedMediaAsset,
  FetchedMediaStream,
} from './types'

/** Maximum proxied raw payload in bytes (25 MiB). */
export const MAX_RAW_MEDIA_BYTES = 25 * 1024 * 1024

/**
 * Wraps an upstream byte stream with a budget guard.
 *
 * @param stream - Upstream response body
 * @param maxBytes - Budget in bytes
 * @param mediaUrl - Source URL for error context
 * @returns The same bytes unless the budget is exceeded, aborting the stream
 */
const withByteBudget = (
  stream: ReadableStream<Uint8Array>,
  maxBytes: number,
  mediaUrl: string
): ReadableStream<Uint8Array> => {
  let seen = 0
  return stream.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        seen += chunk.byteLength
        if (seen > maxBytes) {
          controller.error(
            new InfraError(
              ErrorCodes.EXTERNAL_API_ERROR,
              'Media payload exceeds byte budget',
              { url: mediaUrl, size: seen }
            )
          )
          return
        }
        controller.enqueue(chunk)
      },
    })
  )
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
export const fetchMediaAsset = async (
  mediaUrl: string,
  { signal, accept = '*/*' }: FetchMediaOptions = {}
): Promise<FetchedMediaAsset> => {
  const MAX_BYTES = MAX_RAW_MEDIA_BYTES
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

/**
 * Streams a remote media resource without buffering the full payload.
 *
 * @remarks Forwards an optional `Range` header upstream and propagates a `206`
 * partial response (status, `Content-Range`, `Content-Length`). Enforces
 * {@link MAX_RAW_MEDIA_BYTES} twice: a declared `content-length` over budget
 * aborts with a typed {@link InfraError} before streaming, and a counting
 * transform aborts mid-stream when an unknown-length body exceeds it.
 * @param mediaUrl - Absolute URL of the remote asset
 * @param options - Optional abort signal, Accept override, and Range passthrough
 * @returns Stream plus normalized MIME type and range metadata
 * @throws {DomainError} When the URL is unsafe (pre- or post-redirect)
 * @throws {InfraError} When the remote request fails or exceeds the byte budget
 * @see {@link fetchRawMedia} for the raw proxy consumer
 * @example
 * ```typescript
 * const { stream, status, contentRange } = await fetchMediaStream(url, {
 *   range: request.headers.get('range') ?? undefined,
 * })
 * ```
 */
export const fetchMediaStream = async (
  mediaUrl: string,
  { signal, accept = '*/*', range }: FetchMediaOptions = {}
): Promise<FetchedMediaStream> => {
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
        ...(range ? { Range: range } : {}),
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

    const declaredLength = response.headers.get('content-length')
    if (
      declaredLength !== null &&
      Number(declaredLength) > MAX_RAW_MEDIA_BYTES
    ) {
      throw new InfraError(
        ErrorCodes.EXTERNAL_API_ERROR,
        'Media payload exceeds byte budget',
        { url: mediaUrl, size: Number(declaredLength) }
      )
    }

    if (!response.body) {
      throw new InfraError(
        ErrorCodes.EXTERNAL_API_ERROR,
        'Upstream response has no body',
        { url: mediaUrl }
      )
    }

    const contentType =
      response.headers.get('content-type') ?? 'application/octet-stream'

    return {
      stream: withByteBudget(
        response.body as ReadableStream<Uint8Array>,
        MAX_RAW_MEDIA_BYTES,
        mediaUrl
      ),
      mimeType: contentType.split(';')[0]?.trim() || 'application/octet-stream',
      status: response.status,
      contentRange: response.headers.get('content-range'),
      contentLength: response.headers.get('content-length'),
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
