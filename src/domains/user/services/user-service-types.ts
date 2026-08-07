/**
 * @module @user/services/user-service-types
 * @remarks Parameter shape for {@link userService.getUserProfile}, pairing the
 * requesting actor with the target profile identifier.
 */

export interface GetUserProfileParams {
  userId: string
  targetId: string
}
