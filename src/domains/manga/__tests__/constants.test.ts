import { describe, expect, it } from 'vitest'
import { ADULT_MANGA_GENRES } from '@manga/constants'

describe('manga constants', () => {
  it('defines adult genres', () => {
    expect(ADULT_MANGA_GENRES).toContain('Hentai')
    expect(ADULT_MANGA_GENRES).toContain('Erotica')
  })
})
