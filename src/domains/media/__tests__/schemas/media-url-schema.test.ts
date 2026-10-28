/**
 * Tests for the shared media URL schema (absolute CDN URL or origin-relative
 * `/media/...` path).
 *
 * @module domains/media/__tests__/schemas/media-url-schema
 */
import { describe, expect, it } from 'vitest'
import { mediaUrlSchema } from '@media/schemas'

const parse = (value: unknown) => mediaUrlSchema.safeParse(value)

describe('mediaUrlSchema', () => {
  it('accepts origin-relative media paths', () => {
    expect(parse('/media/anime/5114/poster/large').success).toBe(true)
    expect(parse('/placeholder.webp').success).toBe(true)
  })

  it('accepts absolute URLs (external CDN assets)', () => {
    expect(
      parse('https://cdn.myanimelist.net/images/anime/1.webp').success
    ).toBe(true)
    expect(parse('http://app.test/media/x').success).toBe(true)
  })

  it('rejects protocol-relative and arbitrary strings', () => {
    expect(parse('//evil.example/x').success).toBe(false)
    expect(parse('media/x').success).toBe(false)
    expect(parse('not-a-url').success).toBe(false)
    expect(parse('').success).toBe(false)
    expect(parse(null).success).toBe(false)
  })
})
