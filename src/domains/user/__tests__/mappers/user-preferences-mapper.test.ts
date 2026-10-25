import { describe, expect, it } from 'vitest'
import { mapPreferencesPatchToDb } from '@user/mappers/user-preferences'

describe('mapPreferencesPatchToDb', () => {
  it('maps only provided keys and serializes id lists', () => {
    expect(
      mapPreferencesPatchToDb({ fanaticLevel: 'high', favoriteGenres: [1, 4] })
    ).toEqual({ fanaticLevel: 'high', favoriteGenres: '1,4' })
  })

  it('clears a list with an empty string', () => {
    expect(mapPreferencesPatchToDb({ favoriteAnimes: [] })).toEqual({
      favoriteAnimes: '',
    })
  })
})
