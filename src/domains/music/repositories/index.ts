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
export * from './anime-music-repository'
export * from './music-relation-repository'
export * from './music-repository'
export * from './music-version-repository'
