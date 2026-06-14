/**
 * @module @domains/music/cache
 * @remarks Barrel exports for music cache helpers. Metadata and versions are cached
 * separately so list and detail flows can reuse stable title/artist data.
 * @see {@link ./music-metadata-cache} for stable metadata entries
 * @see {@link ./music-versions-cache} for playable version trees
 * @example
 * ```typescript
 * import { musicMetadataCache, musicVersionsCache } from '@domains/music/cache'
 *
 * const metadata = await musicMetadataCache.get(42)
 * const versions = await musicVersionsCache.get(42)
 * ```
 */

export { musicListCache } from './music-list-cache'
export { musicMetadataCache } from './music-metadata-cache'
export { musicVersionsCache } from './music-versions-cache'
