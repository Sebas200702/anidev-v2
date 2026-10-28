/**
 * Maps a validated preferences patch to profile column values.
 *
 * @module domains/user/mappers/user-preferences/mapper
 */
import type { PreferencesUpdate } from '@user/schemas/user-preferences-write-schema'
import type { NewUserProfileDB } from '@user/types'

/** Id lists are stored as comma-separated text (read back by `mapUserProfile`). */
const toCsv = (ids: number[]) => ids.join(',')

/**
 * Builds the sparse profile update of a preferences patch.
 *
 * @param patch - Validated preferences (only provided keys are mapped)
 * @returns Column values; an empty id list clears its column
 *
 * @example
 * ```ts
 * mapPreferencesPatchToDb({ favoriteGenres: [1, 4] }) // { favoriteGenres: '1,4' }
 * ```
 */
export const mapPreferencesPatchToDb = ({
  fanaticLevel,
  frequency,
  preferredFormat,
  favoriteGenres,
  favoriteStudios,
  favoriteAnimes,
}: PreferencesUpdate): Partial<NewUserProfileDB> => {
  const patch: Partial<NewUserProfileDB> = {}
  if (fanaticLevel) patch.fanaticLevel = fanaticLevel
  if (frequency) patch.frequency = frequency
  if (preferredFormat) patch.preferredFormat = preferredFormat
  if (favoriteGenres) patch.favoriteGenres = toCsv(favoriteGenres)
  if (favoriteStudios) patch.favoriteStudios = toCsv(favoriteStudios)
  if (favoriteAnimes) patch.favoriteAnimes = toCsv(favoriteAnimes)
  return patch
}
