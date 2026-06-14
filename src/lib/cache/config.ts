/**
 * @module lib/cache/config
 *
 * Canonical Redis key prefixes and TTL presets for domain cache layers.
 * Centralizes naming conventions so invalidation, observability, and new
 * cache modules stay consistent across anime, music, and user resources.
 *
 * @remarks
 * Prefix values are concatenated with domain-specific suffixes (e.g. MAL id)
 * at call sites. TTL enum values are in **seconds** as required by Upstash
 * `EX` expiry options.
 *
 * @see {@link module:lib/cache/cache-store} for functions that consume TTL values
 * @see {@link CacheKeyPrefix} for namespaced key roots
 * @see {@link CacheTtl} for standard expiry durations
 */

/**
 * Namespaced Redis key prefixes grouped by cached resource type.
 *
 * @remarks
 * Append stable identifiers after the prefix with a colon separator
 * (e.g. `anime:full:5114`). Do not include secrets or raw user input
 * without normalization.
 */
export enum CacheKeyPrefix {
  /** Full anime aggregate (details + relations); use for detail page payloads. Value: `'anime:full'`. */
  AnimeFull = 'anime:full',

  /** Staff credits for a single anime; invalidated when staff relations change. Value: `'anime:staff'`. */
  AnimeStaff = 'anime:staff',

  /** Paginated or filtered anime list responses. Value: `'anime:list'`. */
  AnimeList = 'anime:list',

  /** Core anime detail record without heavy joins. Value: `'anime:details'`. */
  AnimeDetails = 'anime:details',

  /** Character roster for an anime entry. Value: `'anime:characters'`. */
  AnimeCharacters = 'anime:characters',

  /** Music track detail payloads. Value: `'music:details'`. */
  MusicDetails = 'music:details',

  /** Stable music metadata (title, type, artists). Value: `'music:metadata'`. */
  MusicMetadata = 'music:metadata',

  /** Music versions and playable resolutions. Value: `'music:versions'`. */
  MusicVersions = 'music:versions',

  /** Paginated or filtered music list responses. Value: `'music:list'`. */
  MusicList = 'music:list',

  /** Extended user profile preferences and display fields. Value: `'user:profile'`. */
  UserProfile = 'user:profile',
}

/**
 * Standard cache TTL values in seconds for Upstash `EX` expiry.
 *
 * @remarks
 * Choose shorter TTLs for frequently mutating data; longer for stable catalog
 * metadata. Values are numeric enum members usable directly in `cacheSet`.
 */
export enum CacheTtl {
  /** 300 seconds (5 minutes). Use for highly volatile or user-specific slices. */
  VeryShort = 300,

  /** 1800 seconds (30 minutes). Use for list pages with moderate update frequency. */
  Short = 1800,

  /** 3600 seconds (1 hour). Default for standard detail cache entries. */
  Medium = 3600,

  /** 86400 seconds (24 hours). Use for stable taxonomy or rarely edited records. */
  Long = 86400,

  /** 604800 seconds (7 days). Use for immutable or bulk-imported catalog blobs. */
  VeryLong = 604800,
}
