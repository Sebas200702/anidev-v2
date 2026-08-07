/**
 * @module @media/services/media-fetch-service-types
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
