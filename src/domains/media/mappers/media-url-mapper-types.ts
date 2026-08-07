/**
 * @module @media/mappers/media-url-mapper-types
 * @remarks Input shape for building semantic on-site media optimization URLs from entity
 * metadata.
 */
import type { MediaEntity, MediaType } from '@media/types/media-types'

export interface BuildMediaUrlInput {
  entity: MediaEntity | string
  entity_id: number
  type: MediaType | string
  size?: 'default' | 'small' | 'large'
  slug?: string
  index?: number
  width?: number
  quality?: number
  source?:
    | 'myanimelist'
    | 'anilist'
    | 'kitsu'
    | 'thetvdb'
    | 'tmdb'
    | 'custom'
    | 'youtube'
}
