/**
 * @module @music/repositories
 * @remarks Barrel exports for music data-access repositories. Covers core music rows,
 * version/resolution records, artist relations, and anime-to-music joins.
 * @see {@link ./music-repository} for primary music table queries
 * @see {@link ./anime-music-repository} for anime-linked music lookups
 * @example
 * ```typescript
 * import { musicRepository, animeMusicRepository } from '@music/repositories'
 * ```
 */

export { animeMusicRepository } from './anime-music'
export { buildMusicListFilters, musicListRepository } from './music-list'
export { musicRelationRepository } from './music-relation'
export { musicRepository } from './music'
export { musicVersionRepository } from './music-version'
