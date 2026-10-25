import { describe, expect, it } from 'vitest'
import { stripTrailingSlashes } from '@utils/string/trailing-slash-util'

describe('stripTrailingSlashes', () => {
  it.each([
    ['http://h/b', 'http://h/b'],
    ['http://h/b/', 'http://h/b'],
    ['http://h/b///', 'http://h/b'],
    ['', ''],
  ])('%s → %s', (input, expected) => {
    expect(stripTrailingSlashes(input)).toBe(expected)
  })
})
