/**
 * Tests for {@link normalizeString}.
 *
 * @module shared/__tests__/utils/normalize-string-util
 * @remarks
 * Covers falsy input, punctuation stripping, space replacement, custom separators, and case folding,
 * matching the documented algorithm and edge cases. Follows the repo TDD/unit-test layout.
 */
import { describe, expect, it } from 'vitest'
import { normalizeString } from '@shared/utils/string'

describe('normalizeString', () => {
  it('returns an empty string for falsy input', () => {
    expect(normalizeString({ string: '' })).toBe('')
    expect(normalizeString({ string: '   ' })).toBe('')
  })

  it('strips punctuation and replaces spaces with the default separator', () => {
    expect(
      normalizeString({ string: 'Hello, World!', toLowerCase: true })
    ).toBe('hello-world')
  })

  it('preserves internal spaces when removeSpaces is false', () => {
    expect(normalizeString({ string: 'Foo Bar', removeSpaces: false })).toBe(
      'Foo Bar'
    )
  })

  it('removes only the special-character class', () => {
    expect(
      normalizeString({
        string: 'Note, don\'t "quote" it — keep dx.',
        removeSpaces: false,
      })
    ).toBe('Note dont quote it — keep dx')
  })

  it('uses a custom separator', () => {
    expect(
      normalizeString({ string: 'a b c', separator: '_', toLowerCase: true })
    ).toBe('a_b_c')
  })

  it('lowercases only when toLowerCase is true', () => {
    expect(normalizeString({ string: 'HELLO WORLD' })).toBe('HELLO-WORLD')
    expect(normalizeString({ string: 'HELLO WORLD', toLowerCase: true })).toBe(
      'hello-world'
    )
  })

  it('is falsy-safe and does not throw', () => {
    expect(normalizeString({ string: '' })).toBe('')
    expect(() => normalizeString({ string: '' })).not.toThrow()
  })
})
