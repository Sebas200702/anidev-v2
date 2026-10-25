import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@config/env', () => ({
  env: { NODE_ENV: 'test', LOG_LEVEL: 'silent' },
}))
vi.mock('@/config', () => ({ config: { baseUrl: 'http://app.test' } }))

const m = vi.hoisted(() => ({
  getUserProfileById: vi.fn(),
  updateProfile: vi.fn(),
  invalidate: vi.fn(),
  putObject: vi.fn(),
  deleteObject: vi.fn(),
  isStorageEnabled: vi.fn(),
  processProfileImage: vi.fn(),
  getCharacter: vi.fn(),
  hasSafeAnimeBanner: vi.fn(),
}))
vi.mock('@user/repositories/user', () => ({
  userRepository: {
    getUserProfileById: m.getUserProfileById,
    updateProfile: m.updateProfile,
  },
}))
vi.mock('@user/repositories/profile-gallery', () => ({
  profileGalleryRepository: { hasSafeAnimeBanner: m.hasSafeAnimeBanner },
}))
vi.mock('@people/repositories/character-profile', () => ({
  characterProfileRepository: { getCharacter: m.getCharacter },
}))
vi.mock('@user/cache', () => ({
  userProfileCache: { invalidate: m.invalidate },
}))
vi.mock('@lib/storage', () => ({
  putObject: m.putObject,
  deleteObject: m.deleteObject,
  isStorageEnabled: m.isStorageEnabled,
  publicUrl: (key: string) => `http://s3.test/bucket/${key}`,
}))
vi.mock('@user/utils/profile-image', () => ({
  processProfileImage: m.processProfileImage,
}))

const { profileImageService } = await import('@user/services/profile-image')

const row = (overrides: Record<string, unknown> = {}) => ({
  id: 'u1',
  userId: 'u1',
  avatar: null,
  banner: null,
  avatarKey: null,
  bannerKey: null,
  name: 'Ada',
  lastName: 'Lovelace',
  birthday: null,
  gender: 'female',
  favoriteAnimes: null,
  favoriteGenres: null,
  favoriteStudios: null,
  frequency: null,
  fanaticLevel: null,
  preferredFormat: null,
  watchedAnimes: null,
  ...overrides,
})

const owner = { userId: 'u1', targetId: 'u1' }
const upload = { bytes: new Uint8Array([1]), crop: undefined }
const webp = new Uint8Array([9])

beforeEach(() => {
  vi.clearAllMocks()
  m.isStorageEnabled.mockReturnValue(true)
  m.getUserProfileById.mockResolvedValue(
    row({
      avatar: 'http://s3.test/bucket/old',
      avatarKey: 'users/u1/avatar/old.webp',
    })
  )
  m.updateProfile.mockImplementation(async (_id, patch) => row(patch))
  m.processProfileImage.mockResolvedValue(webp)
  m.putObject.mockResolvedValue(undefined)
  m.deleteObject.mockResolvedValue(undefined)
})

describe('profileImageService.upload', () => {
  it('stores a new key, updates the row, invalidates, then deletes the old object', async () => {
    const profile = await profileImageService.upload({
      ...owner,
      kind: 'avatar',
      upload,
    })

    const [key, bytes, type] = m.putObject.mock.calls[0]
    expect(key).toMatch(/^users\/u1\/avatar\/[0-9a-f-]{36}\.webp$/)
    expect(bytes).toBe(webp)
    expect(type).toBe('image/webp')
    expect(m.updateProfile).toHaveBeenCalledWith('u1', {
      avatar: `http://s3.test/bucket/${key}`,
      avatarKey: key,
    })
    expect(m.invalidate).toHaveBeenCalledWith('u1')
    expect(m.deleteObject).toHaveBeenCalledWith('users/u1/avatar/old.webp')
    expect(profile.avatar).toBe(`http://s3.test/bucket/${key}`)
  })

  it('writes banner columns for a banner upload', async () => {
    await profileImageService.upload({ ...owner, kind: 'banner', upload })
    const [key] = m.putObject.mock.calls[0]
    expect(m.updateProfile).toHaveBeenCalledWith('u1', {
      banner: `http://s3.test/bucket/${key}`,
      bannerKey: key,
    })
    expect(m.deleteObject).not.toHaveBeenCalled()
  })

  it('deletes the just-uploaded object when the update fails', async () => {
    m.updateProfile.mockRejectedValue(new Error('db down'))
    await expect(
      profileImageService.upload({ ...owner, kind: 'avatar', upload })
    ).rejects.toThrow('db down')
    const [key] = m.putObject.mock.calls[0]
    expect(m.deleteObject).toHaveBeenCalledWith(key)
    expect(m.deleteObject).not.toHaveBeenCalledWith('users/u1/avatar/old.webp')
  })

  it('keeps the new profile when deleting the old object fails', async () => {
    m.deleteObject.mockRejectedValue(new Error('s3 down'))
    const profile = await profileImageService.upload({
      ...owner,
      kind: 'avatar',
      upload,
    })
    expect(profile.avatar).toMatch(/^http:\/\/s3\.test\//)
  })

  it('answers STORAGE_NOT_CONFIGURED without touching anything', async () => {
    m.isStorageEnabled.mockReturnValue(false)
    await expect(
      profileImageService.upload({ ...owner, kind: 'avatar', upload })
    ).rejects.toMatchObject({ code: 'STORAGE_NOT_CONFIGURED' })
    expect(m.processProfileImage).not.toHaveBeenCalled()
  })

  it('answers USER_NOT_FOUND before processing when there is no profile', async () => {
    m.getUserProfileById.mockResolvedValue(undefined)
    await expect(
      profileImageService.upload({ ...owner, kind: 'avatar', upload })
    ).rejects.toMatchObject({ code: 'USER_NOT_FOUND' })
    expect(m.putObject).not.toHaveBeenCalled()
  })

  it('refuses another user profile', async () => {
    await expect(
      profileImageService.upload({
        userId: 'u1',
        targetId: 'u2',
        kind: 'avatar',
        upload,
      })
    ).rejects.toMatchObject({ code: 'USER_UNAUTHORIZED' })
    expect(m.putObject).not.toHaveBeenCalled()
  })
})

describe('profileImageService gallery picks', () => {
  it('sets a character portrait and drops the uploaded avatar', async () => {
    m.getCharacter.mockResolvedValue({ malId: 417 })
    const profile = await profileImageService.pickCharacterAvatar({
      ...owner,
      characterId: 417,
    })
    expect(m.updateProfile).toHaveBeenCalledWith('u1', {
      avatar: 'http://app.test/media/character/417/poster/large',
      avatarKey: null,
    })
    expect(m.deleteObject).toHaveBeenCalledWith('users/u1/avatar/old.webp')
    expect(profile.avatar).toBe(
      'http://app.test/media/character/417/poster/large'
    )
  })

  it('rejects an unknown or provisional character with 400', async () => {
    m.getCharacter.mockResolvedValue(undefined)
    await expect(
      profileImageService.pickCharacterAvatar({ ...owner, characterId: 1 })
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' })
    expect(m.updateProfile).not.toHaveBeenCalled()
  })

  it('sets a safe anime banner', async () => {
    m.hasSafeAnimeBanner.mockResolvedValue(true)
    await profileImageService.pickAnimeBanner({ ...owner, animeId: 1 })
    expect(m.updateProfile).toHaveBeenCalledWith('u1', {
      banner: 'http://app.test/media/anime/1/banner',
      bannerKey: null,
    })
  })

  it('rejects an adult anime or one without banner with 400', async () => {
    m.hasSafeAnimeBanner.mockResolvedValue(false)
    await expect(
      profileImageService.pickAnimeBanner({ ...owner, animeId: 1 })
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' })
  })

  it('works without storage when nothing was uploaded', async () => {
    m.isStorageEnabled.mockReturnValue(false)
    m.getUserProfileById.mockResolvedValue(row())
    m.hasSafeAnimeBanner.mockResolvedValue(true)
    await profileImageService.pickAnimeBanner({ ...owner, animeId: 1 })
    expect(m.deleteObject).not.toHaveBeenCalled()
  })
})

describe('profileImageService.reset', () => {
  it('clears the image and deletes the uploaded object', async () => {
    m.getUserProfileById.mockResolvedValue(
      row({
        banner: 'http://s3.test/bucket/b',
        bannerKey: 'users/u1/banner/b.webp',
      })
    )
    const profile = await profileImageService.reset({
      ...owner,
      kind: 'banner',
    })
    expect(m.updateProfile).toHaveBeenCalledWith('u1', {
      banner: null,
      bannerKey: null,
    })
    expect(m.deleteObject).toHaveBeenCalledWith('users/u1/banner/b.webp')
    expect(profile.banner).toBeNull()
  })

  it('answers USER_NOT_FOUND without a profile', async () => {
    m.getUserProfileById.mockResolvedValue(undefined)
    await expect(
      profileImageService.reset({ ...owner, kind: 'avatar' })
    ).rejects.toMatchObject({ code: 'USER_NOT_FOUND' })
  })
})
