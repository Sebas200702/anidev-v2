/**
 * @module @domains/media/types/media-enums
 * @remarks Enumerations for semantic media paths: supported entity types, asset categories, and
 * size variants. Parsed from `/media/{entity}/...` route segments.
 */

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
  EPISODE = 'episode',
  MUSIC = 'music',
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
