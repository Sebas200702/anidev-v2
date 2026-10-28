import { describe, expect, it } from 'vitest'
import { sanitizeCallbackURL } from '@auth/utils/callback-url'

const BASE = 'https://anidev.example'

describe('sanitizeCallbackURL', () => {
  it.each([
    ['/profile', '/profile'],
    ['/search?genre=Action#top', '/search?genre=Action#top'],
    ['/anime/1/cowboy-bebop', '/anime/1/cowboy-bebop'],
  ])('keeps the same-site path %s', (raw, expected) => {
    expect(sanitizeCallbackURL(raw, BASE)).toBe(expected)
  })

  it.each([
    undefined,
    null,
    '',
    'profile',
    'https://evil.example/x',
    '//evil.example',
    '/\\evil.example',
    '/\t/evil.example',
    'javascript:alert(1)',
    `${BASE}/profile`,
  ])('falls back to / for %j', (raw) => {
    expect(sanitizeCallbackURL(raw, BASE)).toBe('/')
  })
})
