import type { MediaEntity, MediaType } from '../types/media'

type BuildMediaUrlInput = {
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
    | 'custom'
    | 'youtube'
}

export const buildMediaUrl = ({
  entity,
  entity_id: id,
  type,
  size,
  slug,
  index,
  width,
  quality,
  source,
}: BuildMediaUrlInput): string => {
  const safeEntity = entity.trim().toLowerCase()
  const safeType = type.trim().toLowerCase()
  const safeSize =
    size === 'small' || size === 'large' || size === 'default'
      ? size
      : undefined
  const safeSlug = slug?.trim()
  const safeIndex =
    typeof index === 'number' && Number.isInteger(index) && index > 0
      ? index
      : undefined

  const basePath = safeSlug
    ? `/media/${safeEntity}/${id}/${safeSlug}/${safeType}`
    : `/media/${safeEntity}/${id}/${safeType}`
  const pathWithSize = safeSize ? `${basePath}/${safeSize}` : basePath
  const path = safeIndex ? `${pathWithSize}/${safeIndex}` : pathWithSize

  const params = new URLSearchParams()
  if (typeof width === 'number' && width > 0) {
    params.set('w', String(width))
  }
  if (typeof quality === 'number' && quality > 0) {
    params.set('q', String(quality))
  }
  if (source) {
    params.set('source', source)
  }

  const query = params.toString()
  return query ? `${path}?${query}` : path
}
