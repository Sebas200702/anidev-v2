/**
 * Authorization policy input types for user resource checks.
 *
 * @module domains/user/types/user-policies-types
 * @remarks
 * Defines the shared parameter object passed to every {@link userPolicies}
 * predicate. Keeps policy signatures consistent across profile, preference,
 * and history checks.
 * @see {@link userPolicies} for rule implementations
 */
/**
 * Identifiers used when evaluating user access policies.
 *
 * @remarks
 * - `userId` — the authenticated actor performing the action (from session).
 * - `targetId` — the resource owner whose profile, preferences, or history
 *   is being accessed. Required for ownership comparisons; omit only when a
 *   policy does not inspect the target (e.g. public profile view).
 *
 * All owner-only rules compare `userId === targetId`.
 * @see {@link userPolicies.canEditUserProfile}
 * @see {@link userPolicies.canViewUserPreferences}
 * @example
 * ```typescript
 * const params: PolicyParameters = {
 *   userId: session.userId,
 *   targetId: route.params.userId,
 * }
 *
 * if (!userPolicies.canEditUserHistory(params)) {
 *   throw userUnauthorized(params.targetId!)
 * }
 * ```
 */
export interface PolicyParameters {
  /** Authenticated actor identifier (the caller). */
  userId: string

  /** Resource owner identifier; compared against `userId` for private resources. */
  targetId?: string
}
