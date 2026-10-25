import { beforeEach, describe, expect, it, vi } from 'vitest'
import { chainResolving } from '@shared/__tests__/helpers/drizzle-mock'

vi.mock('@config/env', () => ({
  env: { NODE_ENV: 'test', LOG_LEVEL: 'silent' },
}))
const { select, insert, values, onConflictDoNothing, error } = vi.hoisted(
  () => {
    const onConflictDoNothing = vi.fn().mockResolvedValue(undefined)
    const values = vi.fn(() => ({ onConflictDoNothing }))
    return {
      select: vi.fn(),
      insert: vi.fn(() => ({ values })),
      values,
      onConflictDoNothing,
      error: vi.fn(),
    }
  }
)
vi.mock('@db/client', () => ({ db: { select, insert } }))
vi.mock('@utils/logger-util', () => ({ logger: { error } }))

const { buildGoogleProfile, bootstrapGoogleProfile } = await import(
  '@lib/auth/google-profile'
)

describe('buildGoogleProfile', () => {
  it.each([
    ['Ada Lovelace', 'Ada', 'Lovelace'],
    ['  María José  de la Cruz ', 'María', 'José de la Cruz'],
    ['Cher', 'Cher', ''],
    ['   ', 'User', ''],
  ])('splits %j', (name, first, last) => {
    expect(
      buildGoogleProfile({ id: 'u1', name, image: 'https://lh3/x' })
    ).toEqual({
      id: 'u1',
      userId: 'u1',
      name: first,
      lastName: last,
      avatar: 'https://lh3/x',
    })
  })
})

describe('bootstrapGoogleProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('ignores non-Google accounts', async () => {
    await bootstrapGoogleProfile({ providerId: 'credential', userId: 'u1' })
    expect(select).not.toHaveBeenCalled()
  })

  it('inserts the profile idempotently for a Google account', async () => {
    select.mockReturnValue(
      chainResolving([{ id: 'u1', name: 'Ada Lovelace', image: null }])
    )
    await bootstrapGoogleProfile({ providerId: 'google', userId: 'u1' })
    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'u1', name: 'Ada', lastName: 'Lovelace' })
    )
    expect(onConflictDoNothing).toHaveBeenCalled()
  })

  it('logs instead of throwing on failure', async () => {
    select.mockImplementation(() => {
      throw new Error('db down')
    })
    await expect(
      bootstrapGoogleProfile({ providerId: 'google', userId: 'u1' })
    ).resolves.toBeUndefined()
    expect(error).toHaveBeenCalled()
  })
})
