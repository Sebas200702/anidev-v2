/**
 * @module domains/media/services/media-fetch/types
 * @remarks Option and result shapes for fetching remote media assets over HTTP.
 */

export interface FetchMediaOptions {
  signal?: AbortSignal
  accept?: string
  range?: string
}

export interface FetchedMediaAsset {
  buffer: Buffer
  mimeType: string
}

export interface FetchedMediaStream {
  stream: ReadableStream<Uint8Array>
  mimeType: string
  status: number
  contentRange: string | null
  contentLength: string | null
}
