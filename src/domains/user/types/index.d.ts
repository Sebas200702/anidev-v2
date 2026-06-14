/**
 * Barrel exports for user domain TypeScript types.
 *
 * @module domains/user/types
 * @remarks
 * Re-exports API-facing types inferred from Zod schemas and Drizzle-derived
 * database row types for the profile table.
 * @see {@link module:domains/user/types/user-types} for API DTO types
 * @see {@link module:domains/user/types/user-db-types} for persistence types
 * @see {@link module:domains/user/types/user-policies-types} for policy inputs
 * @example
 * ```typescript
 * import type { UserProfile, UserProfileDB, PolicyParameters } from '@domains/user/types'
 * ```
 */
export * from './user-db-types'
export * from './user-policies-types'
export * from './user-types'
