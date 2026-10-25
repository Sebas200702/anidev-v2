import { describe, expect, it, vi } from 'vitest'

vi.mock('@config/env', () => ({
  env: {
    APP_BASE_URL: 'https://anidev.app',
    S3_PUBLIC_URL: 'https://media.anidev.app/bucket',
  },
}))

import { profileIdentitySchema } from '@user/schemas/user-profile-write-schema'

const identity = (avatar: string) => ({
  name: 'Ada',
  lastName: 'Lovelace',
  gender: 'female',
  avatar,
})

describe('profileIdentitySchema avatar allowlist', () => {
  it.each([
    'https://anidev.app/media/character/417/poster/large',
    'https://media.anidev.app/bucket/users/u1/avatar/a.webp',
    'https://lh3.googleusercontent.com/a/photo=s96-c',
  ])('accepts %s', (avatar) => {
    expect(profileIdentitySchema.safeParse(identity(avatar)).success).toBe(true)
  })

  it.each([
    'https://tracker.example/pixel.gif',
    'https://anidev.app/api/user/u1',
    'https://anidev.app/media/../api/user/u1',
    'https://lh3.googleusercontent.com.evil.example/a.png',
    'https://media.anidev.app/bucket-other/a.webp',
    'http://anidev.app/media/anime/1/poster',
  ])('rejects %s', (avatar) => {
    expect(profileIdentitySchema.safeParse(identity(avatar)).success).toBe(
      false
    )
  })
})
