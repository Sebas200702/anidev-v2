/**
 * Domain constants for users and profiles.
 *
 * @module domains/user/constants
 */

/** Self-declared engagement level (onboarding step 3). */
export const FANATIC_LEVELS = ['low', 'medium', 'high'] as const

/** How often the user watches anime. */
export const WATCH_FREQUENCIES = ['daily', 'weekly', 'monthly'] as const

/** Preferred anime format. */
export const PREFERRED_FORMATS = [
  'tv',
  'movie',
  'ova',
  'ona',
  'special',
  'music',
] as const

/** Maximum ids per favorite list (genres, studios, anime). */
export const MAX_FAVORITES_PER_LIST = 50

/** Profile images an owner can set. */
export const PROFILE_IMAGE_KINDS = ['avatar', 'banner'] as const

/** Output size per profile image kind (cover-resized, WebP). */
export const PROFILE_IMAGE_SIZES = {
  avatar: { width: 512, height: 512 },
  banner: { width: 1920, height: 534 },
} as const

/** Decoded formats accepted for uploads (sharp `metadata().format`). */
export const PROFILE_IMAGE_INPUT_FORMATS = [
  'jpeg',
  'png',
  'webp',
  'gif',
  'heif',
] as const

/** HEIF compression accepted: AVIF only (HEIC stays out). */
export const PROFILE_IMAGE_HEIF_COMPRESSION = 'av1'

/** Largest accepted upload file (5 MiB). */
export const MAX_PROFILE_IMAGE_BYTES = 5 * 1024 * 1024

/** Multipart framing allowance on top of the file in `Content-Length`. */
export const PROFILE_IMAGE_MULTIPART_OVERHEAD_BYTES = 64 * 1024

/** Decoded pixel cap guarding sharp against decompression bombs. */
export const PROFILE_IMAGE_MAX_INPUT_PIXELS = 40_000_000

/** Smallest crop side in source pixels. */
export const PROFILE_IMAGE_MIN_CROP_SIDE = 16

/** WebP quality for stored profile images. */
export const PROFILE_IMAGE_WEBP_QUALITY = 82

/** MIME type of every stored profile image. */
export const PROFILE_IMAGE_CONTENT_TYPE = 'image/webp'

/** `anime_media.media_type` of the art a profile banner can be picked from. */
export const PROFILE_BANNER_MEDIA_TYPE = 'banner'

/** Google profile pictures (`profile.avatar` from Google sign-in). */
export const GOOGLE_AVATAR_URL_PREFIX = 'https://lh3.googleusercontent.com/'
