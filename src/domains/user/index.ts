/**
 * Public entry point for the user domain.
 *
 * @module domains/user
 * @remarks
 * Re-exports the user domain surface area: cache helpers, domain errors,
 * mappers, authorization policies, repositories, Zod schemas, services, and
 * TypeScript types. Import from this module in routes, middleware, and other
 * domains rather than reaching into subfolders directly.
 * @see {@link module:domains/user/cache} for profile read-through caching
 * @see {@link module:domains/user/errors} for domain-specific error types
 * @see {@link module:domains/user/policies} for profile and preference access rules
 * @see {@link module:domains/user/services} for orchestrated profile reads
 * @example
 * ```typescript
 * import { userService, userPolicies, UserProfile } from '@domains/user'
 *
 * const profile: UserProfile = await userService.getUserProfile({
 *   userId: session.userId,
 *   targetId: params.userId,
 * })
 * ```
 */
export * from './cache'
export * from './errors'
export * from './mappers'
export * from './policies'
export * from './repositories'
export * from './schemas'
export * from './services'
export * from './types'
