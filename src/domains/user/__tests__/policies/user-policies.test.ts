/**
 * Tests for the composed {@link userPolicies}.
 *
 * @module domains/user/__tests__/policies/user-policies
 * @remarks
 * Covers the ownership model: public profile view, owner-only profile edit, and owner-only
 * preferences/history read and write. Exercising the composed object also covers the profile and
 * content policy modules. Follows the repo TDD/unit-test layout.
 */
import { describe, expect, it } from 'vitest'
import { userPolicies } from '@user/policies/user'

const owner = { userId: 'alice', targetId: 'alice' }
const other = { userId: 'alice', targetId: 'bob' }

describe('userPolicies', () => {
  it('allows anyone to view a profile', () => {
    expect(userPolicies.canViewUserProfile(owner)).toBe(true)
    expect(userPolicies.canViewUserProfile(other)).toBe(true)
  })

  it('restricts profile edits to the owner', () => {
    expect(userPolicies.canEditUserProfile(owner)).toBe(true)
    expect(userPolicies.canEditUserProfile(other)).toBe(false)
  })

  it('restricts preferences view and edit to the owner', () => {
    expect(userPolicies.canViewUserPreferences(owner)).toBe(true)
    expect(userPolicies.canViewUserPreferences(other)).toBe(false)
    expect(userPolicies.canEditUserPreferences(owner)).toBe(true)
    expect(userPolicies.canEditUserPreferences(other)).toBe(false)
  })

  it('restricts watch-history view and edit to the owner', () => {
    expect(userPolicies.canViewUserHistory(owner)).toBe(true)
    expect(userPolicies.canViewUserHistory(other)).toBe(false)
    expect(userPolicies.canEditUserHistory(owner)).toBe(true)
    expect(userPolicies.canEditUserHistory(other)).toBe(false)
  })
})
