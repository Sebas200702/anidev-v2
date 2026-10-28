import { describe, expect, it } from 'vitest'
import { mapUserProfile } from '@user/mappers/user'
import type { UserProfileDB } from '@user/types'

const row = (overrides: Partial<UserProfileDB> = {}): UserProfileDB => ({
  id: 'p1',
  userId: 'u1',
  avatar: null,
  banner: null,
  avatarKey: null,
  bannerKey: null,
  name: 'Ana',
  lastName: 'Lee',
  birthday: null,
  gender: null,
  favoriteAnimes: null,
  favoriteGenres: null,
  favoriteStudios: null,
  frequency: null,
  fanaticLevel: null,
  preferredFormat: null,
  watchedAnimes: null,
  ...overrides,
})

describe('mapUserProfile images', () => {
  it('falls back to the placeholder avatar and a null banner', () => {
    const profile = mapUserProfile({ userProfile: row() })
    expect(profile.avatar).toBe('/placeholder.webp')
    expect(profile.banner).toBeNull()
  })

  it('exposes stored image URLs but never the storage keys', () => {
    const profile = mapUserProfile({
      userProfile: row({
        avatar: 'http://localhost:9000/anidev-media/users/u1/avatar/a.webp',
        avatarKey: 'users/u1/avatar/a.webp',
        banner: '/media/anime/1/banner/large',
      }),
    })
    expect(profile.avatar).toBe(
      'http://localhost:9000/anidev-media/users/u1/avatar/a.webp'
    )
    expect(profile.banner).toBe('/media/anime/1/banner/large')
    expect(profile).not.toHaveProperty('avatarKey')
    expect(profile).not.toHaveProperty('bannerKey')
  })
})
