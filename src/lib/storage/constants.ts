/**
 * Storage constants.
 *
 * @module lib/storage/constants
 */

/** `Cache-Control` for uploads: keys are never reused, so cache forever. */
export const IMMUTABLE_CACHE_CONTROL = 'public, max-age=31536000, immutable'
