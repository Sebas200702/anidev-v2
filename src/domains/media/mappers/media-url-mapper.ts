/**
 * @module @domains/media/mappers/media-url-mapper
 * @remarks Builds semantic on-site media optimization URLs from entity metadata. Output paths
 * follow `/media/{entity}/{id}/[{slug}/]{type}/[{size}/][{index}]` with optional `w`, `q`,
 * and `source` query parameters.
 */
import type { MediaEntity, MediaType } from '@domains/media/types/media-types'
import { config } from '@/config'

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
    | 'tmdb'
    | 'custom'
    | 'youtube'
}

/**
 * Constructs an on-site media optimization URL from entity metadata.
 *
 * @remarks Entity and media type segments are lowercased and trimmed. Invalid size values are
 * omitted rather than producing malformed paths. Positive integer `index` values append a
 * 1-based asset selector segment consumed by {@link mapIndexedMediaAsset}.
 * @param input - Entity, media type, size, slug, index, and optional transform query params
 * @returns Absolute media URL with origin from {@link config.baseUrl}
 * @throws Does not throw; silently drops invalid optional segments
 * @see {@link parseMediaPath} for parsing these paths back into {@link SemanticMediaPath}
 * @see {@link mediaService.optimizeMedia} for serving optimized bytes from the path
 * @example
 * ```typescript
 * buildMediaUrl({
 *   entity: 'anime',
 *   entity_id: 5114,
 *   type: 'poster',
 *   size: 'large',
 *   source: 'myanimelist',
 *   width: 400,
 *   quality: 75,
 * })
 * // "https://anidev.example/media/anime/5114/poster/large?w=400&q=75&source=myanimelist"
 *
 * buildMediaUrl({
 *   entity: 'anime',
 *   entity_id: 5114,
 *   slug: 'fullmetal-alchemist-brotherhood',
 *   type: 'banner',
 * })
 * // "https://anidev.example/media/anime/5114/fullmetal-alchemist-brotherhood/banner"
 * ```
 */
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
  const relative = query ? `${path}?${query}` : path
  return `${config.baseUrl}${relative}`
}
