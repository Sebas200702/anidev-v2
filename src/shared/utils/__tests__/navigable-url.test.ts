/**
 * Tests for navigable URL validation.
 *
 * @module shared/utils/__tests__/navigable-url
 * @remarks
 * Covers same-origin paths, allowlisted schemes, dangerous schemes, and the
 * `toNavigableUrl` passthrough. Follows the repo TDD/unit-test layout.
 */
import { describe, expect, it } from 'vitest'
import { isNavigableUrl, toNavigableUrl } from '@shared/utils/navigable-url'

describe('isNavigableUrl', () => {
  it('accepts same-origin relative paths', () => {
    expect(isNavigableUrl('/showcase?component=x')).toBe(true)
    expect(isNavigableUrl('/')).toBe(true)
  })

  it('accepts absolute http(s) URLs', () => {
    expect(isNavigableUrl('https://anidev.app/anime')).toBe(true)
    expect(isNavigableUrl('http://localhost:4321/x')).toBe(true)
  })

  it('rejects empty, protocol-relative, and dangerous targets', () => {
    expect(isNavigableUrl('')).toBe(false)
    expect(isNavigableUrl('   ')).toBe(false)
    expect(isNavigableUrl('//evil.test/x')).toBe(false)
    expect(isNavigableUrl('javascript:alert(1)')).toBe(false)
    expect(isNavigableUrl('data:text/html,<h1>x</h1>')).toBe(false)
    expect(isNavigableUrl('vbscript:msgbox(1)')).toBe(false)
  })

  it('rejects unparsable values', () => {
    expect(isNavigableUrl('://missing-scheme')).toBe(false)
  })
})

describe('toNavigableUrl', () => {
  it('passes safe values through and drops unsafe ones', () => {
    expect(toNavigableUrl('/retry')).toBe('/retry')
    expect(toNavigableUrl('javascript:alert(1)')).toBeUndefined()
  })
})
