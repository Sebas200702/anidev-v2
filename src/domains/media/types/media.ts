import type { ImageFormat, OptimizeOptions } from '@/core/utils/image/optimize'

export interface OptimizedMedia {
  buffer: Buffer
  mimeType: string
}

export enum MediaEntity {
  ANIME = 'anime',
  CHARACTER = 'character',
  STAFF = 'staff',
  STUDIO = 'studio',
}

export enum MediaType {
  POSTER = 'poster',
  BANNER = 'banner',
  BACKGROUND = 'background',
  CLEARART = 'clearart',
  CLEARLOGO = 'clearlogo',
  ICON = 'icon',
}

export enum MediaSize {
  DEFAULT = 'default',
  SMALL = 'small',
  LARGE = 'large',
}

export interface SemanticMediaPath {
  entityId: number
  entityType: MediaEntity
  mediaType: MediaType
  mediaSize: MediaSize
  mediaId?: number
  slug?: string
}

export interface MediaAsset {
  id: number
  mediaType: string
  src: string
  size: string | null
}

export interface MediaRequestQuery {
  w?: number
  q?: number
}

export interface MediaRequestParams {
  path: string
}

export interface MediaRequest {
  params: MediaRequestParams
  query: MediaRequestQuery
  body?: unknown
}

export interface MediaServiceConfig {
  defaultQuality: number
  defaultFormat: ImageFormat
  defaultPlaceholderUrl: string
  supportedMediaTypes: MediaType[]
  supportedEntities: MediaEntity[]
}

export type MediaCacheKeyOptions = OptimizeOptions
