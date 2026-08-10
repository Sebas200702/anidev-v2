/**
 * @module domains/user/services/user/types
 * @remarks Parameter shapes for {@link userService}, pairing the requesting
 * actor with the target profile identifier and write payloads.
 */
import type { z } from 'zod'
import type {
  createUserProfileSchema,
  updateUserProfileSchema,
} from '@user/schemas'

export interface GetUserProfileParams {
  userId: string
  targetId: string
}

export type CreateUserProfileInput = z.infer<typeof createUserProfileSchema>
export type UpdateUserProfileInput = z.infer<typeof updateUserProfileSchema>

export interface CreateUserProfileParams {
  userId: string
  input: CreateUserProfileInput
}

export interface UpdateUserProfileParams {
  userId: string
  targetId: string
  input: UpdateUserProfileInput
}
