/**
 * Barrel exports for user domain Zod schemas.
 *
 * @module domains/user/schemas
 * @remarks
 * Re-exports runtime validation schemas for user profile API payloads,
 * nested preference/history objects, and route parameter parsing.
 * @see {@link module:domains/user/schemas/user-schema} for schema definitions
 * @example
 * ```typescript
 * import { userProfileSchema, getUserProfileSchema } from '@domains/user/schemas'
 * ```
 */
export * from './user-preferences-schema'
export * from './user-schema'
