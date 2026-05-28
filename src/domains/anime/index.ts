/**
 * Public entry point for the anime domain module.
 *
 * @module domains/anime
 * @remarks
 * Vertical slice for anime catalog data: repositories (Drizzle), services
 * (cache + orchestration), mappers (DTOs), Zod schemas, domain errors, and
 * Astro UI components.
 *
 * @example
 * ```typescript
 * import { animeService, animeNotFound } from '@domains/anime'
 * const details = await animeService.getAnimeDetails(5114)
 * ```
 *
 * @see {@link animeService}
 * @see {@link animeListService}
 * @see {@link animeFullService}
 */
export * from './cache'
export * from './components'
export * from './errors'
export * from './mappers'
export * from './repositories'
export * from './schemas'
export * from './services'
export * from './types'
