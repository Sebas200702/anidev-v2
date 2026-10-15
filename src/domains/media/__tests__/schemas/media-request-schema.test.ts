/**
 * Tests for media request width bounds.
 *
 * @module domains/media/__tests__/schemas/media-request-schema
 */
import { describe, expect, it } from 'vitest'
import { mediaRequestSchema } from '@media/schemas/media-schema'

const parse = (query: Record<string, unknown>) =>
  mediaRequestSchema.safeParse({
    params: { path: 'anime/5114/poster/large' },
    query,
  })

describe('mediaRequestSchema — width bound', () => {
  it('rejects w below 16 and above 2048', () => {
    expect(parse({ w: '8' }).success).toBe(false)
    expect(parse({ w: '4096' }).success).toBe(false)
  })

  it('accepts w within bounds', () => {
    expect(parse({ w: '400' }).success).toBe(true)
    expect(parse({}).success).toBe(true)
  })
})
