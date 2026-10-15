/**
 * Tests for music list page bounds.
 *
 * @module domains/music/__tests__/schemas/music-list-schema
 */
import { describe, expect, it } from 'vitest'
import { musicListRequestSchema } from '@music/schemas/music-list-schema'

describe('musicListRequestSchema — page bound', () => {
  it('rejects page over 10000', () => {
    expect(
      musicListRequestSchema.safeParse({ query: { page: '10001' } }).success
    ).toBe(false)
  })

  it('accepts page at the boundary', () => {
    expect(
      musicListRequestSchema.safeParse({ query: { page: '10000' } }).success
    ).toBe(true)
  })
})
