/**
 * @module @domains/music/repositories
 * @remarks Barrel exports for music data-access repositories. Covers core music rows,
 * version/resolution records, artist relations, and anime-to-music joins.
 * @see {@link ./music-repository} for primary music table queries
 * @see {@link ./anime-music-repository} for anime-linked music lookups
 * @example
 * ```typescript
 * import { musicRepository, animeMusicRepository } from '@domains/music/repositories'
 * ```
 */

export { animeMusicRepository } from './anime-music-repository'
export { buildMusicListFilters, musicListRepository } from './music-list-repository'
export { musicRelationRepository } from './music-relation-repository'
export { musicRepository } from './music-repository'
export { musicVersionRepository } from './music-version-repository'
