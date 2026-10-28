import { describe, expect, it } from 'vitest'
import { resolveProfileStatus } from '@user/utils/profile-status'

describe('resolveProfileStatus', () => {
  it('is missing without a profile row', () => {
    expect(resolveProfileStatus(undefined)).toBe('missing')
  })

  it.each([
    [{ gender: null, birthday: '2000-01-01' }],
    [{ gender: 'female', birthday: null }],
    [{ gender: '', birthday: '' }],
  ])('is incomplete when onboarding fields are empty (%o)', (profile) => {
    expect(resolveProfileStatus(profile)).toBe('incomplete')
  })

  it('is complete with gender and birthday', () => {
    expect(
      resolveProfileStatus({ gender: 'female', birthday: '2000-01-01' })
    ).toBe('complete')
  })
})
