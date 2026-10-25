import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@config/env', () => ({
  env: { NODE_ENV: 'test', LOG_LEVEL: 'silent' },
}))

const m = vi.hoisted(() => ({
  findMissing: vi.fn(),
  updateProfile: vi.fn(),
  invalidate: vi.fn(),
}))
vi.mock('@user/repositories/catalog-ids', () => ({
  catalogIdsRepository: { findMissing: m.findMissing },
}))
vi.mock('@user/repositories/user', () => ({
  userRepository: { updateProfile: m.updateProfile },
}))
vi.mock('@user/cache', () => ({
  userProfileCache: { invalidate: m.invalidate },
}))

const { userPreferencesService } = await import(
  '@user/services/user-preferences'
)

const row = {
  id: 'u1',
  userId: 'u1',
  avatar: null,
  name: 'Ada',
  lastName: 'Lovelace',
  birthday: null,
  gender: 'female',
  favoriteAnimes: null,
  favoriteGenres: '1,4',
  favoriteStudios: null,
  frequency: null,
  fanaticLevel: 'high',
  preferredFormat: null,
  watchedAnimes: null,
}
const none = { genres: [], studios: [], animes: [] }

beforeEach(() => {
  vi.clearAllMocks()
  m.findMissing.mockResolvedValue(none)
  m.updateProfile.mockResolvedValue(row)
})

describe('userPreferencesService.updatePreferences', () => {
  it('writes, invalidates the cache and returns the profile', async () => {
    const profile = await userPreferencesService.updatePreferences({
      userId: 'u1',
      targetId: 'u1',
      input: { fanaticLevel: 'high', favoriteGenres: [1, 4] },
    })
    expect(m.updateProfile).toHaveBeenCalledWith('u1', {
      fanaticLevel: 'high',
      favoriteGenres: '1,4',
    })
    expect(m.invalidate).toHaveBeenCalledWith('u1')
    expect(profile.preferences?.favoriteGenres).toEqual([1, 4])
  })

  it('forbids editing another user', async () => {
    await expect(
      userPreferencesService.updatePreferences({
        userId: 'u2',
        targetId: 'u1',
        input: { frequency: 'daily' },
      })
    ).rejects.toMatchObject({ code: 'USER_UNAUTHORIZED' })
    expect(m.updateProfile).not.toHaveBeenCalled()
  })

  it('rejects unknown catalog ids with details', async () => {
    m.findMissing.mockResolvedValue({ ...none, studios: [999] })
    await expect(
      userPreferencesService.updatePreferences({
        userId: 'u1',
        targetId: 'u1',
        input: { favoriteStudios: [999] },
      })
    ).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      details: { unknownIds: { studios: [999] } },
    })
  })

  it('reports a missing profile', async () => {
    m.updateProfile.mockResolvedValue(undefined)
    await expect(
      userPreferencesService.updatePreferences({
        userId: 'u1',
        targetId: 'u1',
        input: { frequency: 'daily' },
      })
    ).rejects.toMatchObject({ code: 'USER_NOT_FOUND' })
  })
})
