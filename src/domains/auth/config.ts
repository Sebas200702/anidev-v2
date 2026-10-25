/**
 * Auth provider configuration derived from the environment.
 *
 * @module domains/auth/config
 */
import { env } from '@config/env'

/**
 * Whether Google sign-in is configured (`GOOGLE_CLIENT_ID` + secret).
 *
 * @returns `true` when both credentials are present
 */
export const isGoogleEnabled = (): boolean =>
  Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET)
