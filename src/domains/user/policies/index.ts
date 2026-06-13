/**
 * Barrel exports for user domain authorization policies.
 *
 * @module domains/user/policies
 * @remarks
 * Re-exports pure policy predicates that gate access to profiles,
 * preferences, and watch history.
 * @see {@link module:domains/user/policies/user-policy} for rule definitions
 * @example
 * ```typescript
 * import { userPolicies } from '@domains/user/policies'
 * ```
 */
export * from './user-profile-policy'
export * from './user-content-policy'
export * from './user-policy'
