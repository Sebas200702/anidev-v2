/**
 * Route logic for the public user profile endpoint.
 *
 * @module pages/api/user/handlers
 * @remarks
 * Pure handler units behind `GET`/`PATCH /api/user/:userId` (wired in
 * `[userId].ts`): session-optional public reads and session-required
 * owner-only writes. Extracted so the route file stays a thin
 * validation/envelope composition.
 *
 * @see {@link userService.getUserProfile} — read service
 * @see {@link userService.updateUserProfile} — write service
 */
import type { APIContext } from 'astro'
import type { z } from 'zod'
import { userService } from '@user/services/user'
import type {
  getUserProfileSchema,
  updateUserProfileSchema,
} from '@user/schemas'
import { requireAuthSession } from '@auth/utils'
import { authForbidden } from '@shared/errors/auth-errors'
import type { User } from '@lib/auth/server'

type ReadValidated = z.infer<typeof getUserProfileSchema>
type WriteValidated = z.infer<typeof updateUserProfileSchema>

interface ActorLocals {
  user: User | null
}

/**
 * Loads the public profile view for a target user id.
 *
 * @param params - Request locals (optional session actor) and validated params
 * @returns Handler result with the mapped profile
 */
export const readUserProfile = async (
  context: APIContext & { locals: ActorLocals; validated: ReadValidated }
) => {
  const { locals, validated } = context
  const { userId: targetId } = validated.params
  const { user } = locals
  const userProfile = await userService.getUserProfile({
    userId: user?.id ?? 'anonymous',
    targetId,
  })
  return { data: userProfile, status: 200, meta: {} }
}

/**
 * Applies an owner-only partial identity update.
 *
 * @param params - Request locals (session required) and validated params/body
 * @returns Handler result with the updated profile
 * @throws {AuthError} When no session exists or the target is not the actor
 */
export const writeUserProfile = async (
  context: APIContext & { locals: ActorLocals; validated: WriteValidated }
) => {
  const { locals, validated } = context
  const user = locals.user as User | null
  const sessionId = requireAuthSession({ user })
  const { userId: targetId } = validated.params
  if (targetId !== sessionId) {
    throw authForbidden({ targetId, sessionId })
  }

  const profile = await userService.updateUserProfile({
    userId: sessionId,
    targetId,
    input: validated,
  })
  return { data: profile, status: 200, meta: {} }
}
