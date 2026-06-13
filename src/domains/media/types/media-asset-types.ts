/**
 * @module @domains/media/types/media-asset-types
 * @remarks Types describing optimized output bytes, parsed semantic route segments, and persisted
 * media asset metadata. Used across repositories, mappers, cache keys, and the optimization
 * pipeline.
 */
import type {
  MediaEntity,
  MediaType,
  MediaSize,
} from '@domains/media/types/media-enums'

/**
 * Optimized image bytes ready for HTTP delivery.
 *
 * @remarks Output of {@link optimizeMediaImageBuffer} and cached by {@link mediaCache}.
 * @see {@link mediaService.optimizeMedia} for pipeline orchestration
 * @example
 * ```typescript
 * const optimized: OptimizedMedia = await mediaService.optimizeMedia(parsedPath, { width: 400 })
 * res.setHeader('Content-Type', optimized.mimeType)
 * res.send(optimized.buffer)
 * ```
 */
export interface OptimizedMedia {
  /** Raw optimized image bytes. */
  buffer: Buffer
  /** MIME type of the optimized output (e.g. `image/webp`). */
  mimeType: string
}

/**
 * Parsed semantic media route segments.
 *
 * @remarks Produced by {@link parseMediaPath} from catch-all route params such as
 * `anime/5114/poster/large/2`. Optional `slug` is preserved when present in the path but
 * is not required for asset resolution.
 * @see {@link buildMediaUrl} for constructing compatible paths
 * @see {@link mediaService.optimizeMedia} for serving optimized bytes
 * @example
 * ```typescript
 * const params: SemanticMediaPath = {
 *   entityType: MediaEntity.ANIME,
 *   entityId: 5114,
 *   mediaType: MediaType.POSTER,
 *   mediaSize: MediaSize.LARGE,
 *   mediaId: 2,
 * }
 * ```
 */
export interface SemanticMediaPath {
  /** Numeric entity identifier (MAL ID for anime). */
  entityId: number
  /** Entity category parsed from the path prefix. */
  entityType: MediaEntity
  /** Asset category (poster, banner, etc.). */
  mediaType: MediaType
  /** Size variant requested in the path. */
  mediaSize: MediaSize
  /** Optional 1-based index selecting among multiple assets of the same type/size. */
  mediaId?: number
  /** Optional slug segment included in SEO-friendly URLs. */
  slug?: string
  /** Version label for music/episode assets (e.g. "1", "2"). */
  version?: string
  /** Resolution label for music/episode assets (e.g. "720", "1080"). */
  resolution?: string
}

/**
 * Persisted or resolved media asset metadata.
 *
 * @remarks Loaded from entity media repositories and filtered by {@link mapFilteredMediaAssets}.
 * The `src` field holds the absolute URL fetched during optimization.
 * @see {@link animeMediaRepository} for anime asset queries
 * @example
 * ```typescript
 * const asset: MediaAsset = {
 *   id: 1,
 *   mediaType: 'poster',
 *   src: 'https://cdn.myanimelist.net/images/anime/1.jpg',
 *   size: 'large',
 * }
 * ```
 */
export interface MediaAsset {
  /** Primary key of the media row. */
  id: number
  /** Asset category matching {@link MediaType} values. */
  mediaType: string
  /** Absolute source URL fetched and optimized at request time. */
  src: string
  /** Size label stored in the database, normalized during filtering. */
  size: string | null
}
