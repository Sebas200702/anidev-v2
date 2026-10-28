import { describe, expect, it } from 'vitest'
import { updateUserPreferencesSchema } from '@user/schemas/user-preferences-write-schema'

const parse = (body: unknown) =>
  updateUserPreferencesSchema.safeParse({ params: { userId: 'u1' }, body })

describe('updateUserPreferencesSchema', () => {
  it('accepts a partial update and dedupes ids', () => {
    const result = parse({ fanaticLevel: 'high', favoriteGenres: [1, 4, 1] })
    expect(result.success).toBe(true)
    expect(result.data?.body).toEqual({
      fanaticLevel: 'high',
      favoriteGenres: [1, 4],
    })
  })

  it('accepts clearing a list with []', () => {
    expect(parse({ favoriteAnimes: [] }).success).toBe(true)
  })

  it.each([
    {},
    { fanaticLevel: 'extreme' },
    { frequency: 'yearly' },
    { preferredFormat: 'manga' },
    { favoriteStudios: [0] },
    { favoriteStudios: ['14'] },
    { favoriteGenres: Array.from({ length: 51 }, (_, i) => i + 1) },
    { unknownField: true },
  ])('rejects %o', (body) => {
    expect(parse(body).success).toBe(false)
  })
})
