/**
 * @module @domains/media/types/media-types
 * @remarks Shared media domain types for semantic route paths, persisted assets, HTTP request
 * shapes, optimized output, and service configuration. Used across repositories, mappers,
 * cache keys, and the optimization pipeline.
 */
import type { ImageFormat, OptimizeOptions } from '@utils/image/optimize-util'

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
 * Supported entity types for semantic media paths.
 *
 * @remarks Parsed from the first segment of `/media/{entity}/...` routes.
 * @see {@link SemanticMediaPath.entityType}
 * @example
 * ```typescript
 * MediaEntity.ANIME // "anime"
 * ```
 */
export enum MediaEntity {
  ANIME = 'anime',
  CHARACTER = 'character',
  STAFF = 'staff',
  STUDIO = 'studio',
}

/**
 * Supported media asset categories.
 *
 * @remarks Parsed from semantic path segments and matched against repository `mediaType` columns.
 * @see {@link SemanticMediaPath.mediaType}
 * @example
 * ```typescript
 * MediaType.POSTER // "poster"
 * ```
 */
export enum MediaType {
  POSTER = 'poster',
  BANNER = 'banner',
  BACKGROUND = 'background',
  CLEARART = 'clearart',
  CLEARLOGO = 'clearlogo',
  ICON = 'icon',
}

/**
 * Supported size variants for media assets.
 *
 * @remarks Parsed from optional path segments (`default`, `small`, `large`) and compared via
 * {@link normalizeAssetSize} during asset filtering.
 * @see {@link SemanticMediaPath.mediaSize}
 * @example
 * ```typescript
 * MediaSize.LARGE // "large"
 * ```
 */
export enum MediaSize {
  DEFAULT = 'default',
  SMALL = 'small',
  LARGE = 'large',
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

/**
 * Optional width and quality query params for media routes.
 *
 * @remarks Validated by {@link mediaRequestSchema} as `w` and `q` query keys.
 * @see {@link MediaRequest.query}
 * @example
 * ```typescript
 * const query: MediaRequestQuery = { w: 400, q: 75 }
 * ```
 */
export interface MediaRequestQuery {
  /** Target output width in pixels. */
  w?: number
  /** Output quality from 1–100. */
  q?: number
}

/**
 * Catch-all media route path parameter.
 *
 * @remarks Contains the path segment after `/media/` without the leading slash.
 * @see {@link MediaRequest.params}
 * @example
 * ```typescript
 * const params: MediaRequestParams = { path: 'anime/5114/poster/large' }
 * ```
 */
export interface MediaRequestParams {
  /** Catch-all media path segments. */
  path: string
}

/**
 * Validated media proxy request shape.
 *
 * @remarks Inferred from {@link mediaRequestSchema}. Combines path params, transform query
 * params, and an optional body for future extensibility.
 * @see {@link mediaRequestSchema} for runtime validation
 * @example
 * ```typescript
 * const request: MediaRequest = {
 *   params: { path: 'anime/5114/poster/large' },
 *   query: { w: 400, q: 75 },
 * }
 * ```
 */
export interface MediaRequest {
  /** Catch-all path parameter object. */
  params: MediaRequestParams
  /** Optional width/quality transform query params. */
  query: MediaRequestQuery
  /** Optional request body (unused by GET media routes). */
  body?: unknown
}

/**
 * Runtime defaults for media resolution and optimization.
 *
 * @remarks Defined in {@link mediaServiceConfig} and referenced by {@link mediaService.resolveMedia}
 * for placeholder fallbacks and supported entity/type allowlists.
 * @see {@link mediaServiceConfig}
 * @example
 * ```typescript
 * const config: MediaServiceConfig = mediaServiceConfig
 * console.log(config.defaultQuality, config.defaultFormat)
 * ```
 */
export interface MediaServiceConfig {
  /** Default JPEG/WebP quality when query param `q` is omitted. */
  defaultQuality: number
  /** Default output format when not specified in optimization options. */
  defaultFormat: ImageFormat
  /** Fallback image URL returned when no matching asset exists. */
  defaultPlaceholderUrl: string
  /** Media types supported by semantic path resolution. */
  supportedMediaTypes: MediaType[]
  /** Entity types supported by semantic path resolution. */
  supportedEntities: MediaEntity[]
}

/**
 * Optimization options used when building media cache keys.
 *
 * @remarks Alias of {@link OptimizeOptions}; width, quality, format, and source all participate
 * in {@link mediaCache} key generation so distinct transforms produce distinct cache entries.
 * @see {@link mediaCache.key}
 * @example
 * ```typescript
 * const options: MediaCacheKeyOptions = { width: 400, quality: 75, format: 'webp' }
 * const key = mediaCache.key(parsedPath, options)
 * ```
 */
export type MediaCacheKeyOptions = OptimizeOptions
