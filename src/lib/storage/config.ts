/**
 * Object storage configuration derived from the environment.
 *
 * @module lib/storage/config
 */
import { env } from '@config/env'
import { STORAGE_KEYS } from '@config/env-fields'

/**
 * Whether S3-compatible storage is configured (the full `S3_*` set).
 *
 * @remarks
 * `env.ts` already rejects a partial set, so every key is checked only to
 * keep this safe under mocked environments.
 *
 * @returns `true` when uploads can be stored
 */
export const isStorageEnabled = (): boolean =>
  STORAGE_KEYS.every((key) => Boolean(env[key]))
