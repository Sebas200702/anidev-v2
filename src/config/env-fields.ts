/**
 * Reusable Zod field builders and key sets for {@link module:config/env}.
 *
 * @module config/env-fields
 * @remarks
 * Docker Compose forwards unset variables as empty strings (`${VAR:-}`), so
 * every optional field treats `''` as unset.
 */
import { z } from 'zod'

const emptyAsUnset = (value: unknown) => (value === '' ? undefined : value)

/** Optional credential: an empty string counts as unset. */
export const optionalSecret = z.preprocess(
  emptyAsUnset,
  z.string().min(1).optional()
)

/** Optional URL: an empty string counts as unset. */
export const optionalUrl = z.preprocess(emptyAsUnset, z.url().optional())

/**
 * String with a fallback used when the variable is unset or empty.
 *
 * @param fallback - Value applied when the variable is missing
 */
export const withDefault = (fallback: string) =>
  z.preprocess(emptyAsUnset, z.string().default(fallback))

/** Storage variables that must be set together (or all left empty). */
export const STORAGE_KEYS = [
  'S3_ENDPOINT',
  'S3_BUCKET',
  'S3_ACCESS_KEY_ID',
  'S3_SECRET_ACCESS_KEY',
  'S3_PUBLIC_URL',
] as const
