import { describe, expect, it } from 'vitest'
import {
  isNewerOrBetter,
  NEWEST_WINS_TOLERANCE_MS,
} from '@user/utils/is-newer-or-better'

describe('isNewerOrBetter', () => {
  it('returns true when no existing', () => {
    expect(
      isNewerOrBetter({ progressSeconds: 10, updatedAt: new Date() }, null)
    ).toBe(true)
  })

  it('returns true when incoming is newer beyond tolerance', () => {
    const existing = { progressSeconds: 10, updatedAt: new Date(0) }
    const incoming = {
      progressSeconds: 5,
      updatedAt: new Date(NEWEST_WINS_TOLERANCE_MS + 10),
    }
    expect(isNewerOrBetter(incoming, existing)).toBe(true)
  })

  it('picks higher progress within tolerance', () => {
    const now = new Date(1000)
    const existing = { progressSeconds: 10, updatedAt: now }
    const incoming = { progressSeconds: 20, updatedAt: new Date(1000 + 500) }
    expect(isNewerOrBetter(incoming, existing)).toBe(true)
  })

  it('returns false when existing is better', () => {
    const now = new Date(1000)
    const existing = { progressSeconds: 20, updatedAt: now }
    const incoming = { progressSeconds: 10, updatedAt: new Date(1000 + 500) }
    expect(isNewerOrBetter(incoming, existing)).toBe(false)
  })
})
