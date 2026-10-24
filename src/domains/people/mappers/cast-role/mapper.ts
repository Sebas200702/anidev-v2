/**
 * Normalization of source cast roles.
 *
 * @module domains/people/mappers/cast-role/mapper
 */
import { CAST_ROLES } from '@people/constants'
import type { CastRole } from '@people/types'

/**
 * Maps a source role (`MAIN`, `Main`, `SUPPORTING`, …) to a {@link CastRole}.
 *
 * @param role - Raw `anime_character.role` / `manga_character.role`
 * @returns The normalized role; unknown or empty values become `supporting`
 *
 * @example
 * ```ts
 * normalizeCastRole('MAIN') // 'main'
 * ```
 */
export const normalizeCastRole = (role: string | null): CastRole => {
  const normalized = role?.trim().toLowerCase()
  return CAST_ROLES.find((castRole) => castRole === normalized) ?? 'supporting'
}
