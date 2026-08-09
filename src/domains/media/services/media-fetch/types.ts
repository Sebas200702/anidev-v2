/**
 * @module domains/media/services/media-fetch/types
 * @remarks Option and result shapes for fetching remote media assets over HTTP.
 */

export interface FetchMediaOptions {
  signal?: AbortSignal
  accept?: string
}

export interface FetchedMediaAsset {
  buffer: Buffer
  mimeType: string
}
