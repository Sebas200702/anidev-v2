/**
 * Barrel exports for user domain services.
 *
 * @module domains/user/services
 * @remarks
 * Re-exports the application service layer that orchestrates authorization,
 * caching, persistence, and mapping for user profile reads.
 * @see {@link module:domains/user/services/user-service} for the service implementation
 * @example
 * ```typescript
 * import { userService } from '@domains/user/services'
 * ```
 */

export { userService } from './user-service'
