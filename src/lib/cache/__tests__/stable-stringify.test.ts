/**
 * Tests for {@link stableStringify}.
 *
 * @module lib/cache/__tests__/stable-stringify
 * @remarks
 * Proves permuted filter objects canonicalize to one key, nesting is handled,
 * and array order stays significant. Follows the repo TDD/unit-test layout.
 */
import { describe, expect, it } from 'vitest'
import { stableStringify } from '@lib/cache/stable-stringify'

describe('stableStringify', () => {
  it('produces identical keys for permuted filter objects', () => {
    const a = { page: 1, limit: 10, genre: ['Action'], parentalVariant: 'safe' }
    const b = { parentalVariant: 'safe', genre: ['Action'], page: 1, limit: 10 }

    expect(stableStringify(a)).toBe(stableStringify(b))
  })

  it('sorts nested objects recursively', () => {
    expect(stableStringify({ z: { b: 1, a: 2 } })).toBe(
      stableStringify({ z: { a: 2, b: 1 } })
    )
  })

  it('keeps array order significant', () => {
    expect(stableStringify({ genre: ['A', 'B'] })).not.toBe(
      stableStringify({ genre: ['B', 'A'] })
    )
  })

  it('matches JSON.stringify for already-sorted input', () => {
    const filters = { limit: 10, page: 1 }
    expect(stableStringify(filters)).toBe(JSON.stringify(filters))
  })
})
