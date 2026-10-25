/**
 * Allowlist for client-written avatar URLs.
 *
 * @module domains/user/utils/avatar-url/util
 * @remarks
 * A profile avatar is shown to every visitor, so an arbitrary URL would let
 * a user embed a tracking pixel. Only the app's own `/media` catalog art,
 * the storage bucket and Google profile pictures are accepted. URLs are
 * normalized first, so `..` segments cannot escape `/media/`.
 */
import { env } from '@config/env'
import { GOOGLE_AVATAR_URL_PREFIX } from '@user/constants'

const withTrailingSlash = (url: string) => url.replace(/\/*$/, '/')

const allowedPrefixes = () =>
  [
    `${withTrailingSlash(env.APP_BASE_URL)}media/`,
    env.S3_PUBLIC_URL && withTrailingSlash(env.S3_PUBLIC_URL),
    GOOGLE_AVATAR_URL_PREFIX,
  ].filter((prefix): prefix is string => Boolean(prefix))

/**
 * Whether `value` may be stored as a profile avatar.
 *
 * @param value - Absolute URL sent by the client
 * @returns `true` when it points at an allowed origin and path
 */
export const isAllowedAvatarUrl = (value: string): boolean => {
  let href: string
  try {
    href = new URL(value).href
  } catch {
    return false
  }
  return allowedPrefixes().some((prefix) => href.startsWith(prefix))
}
