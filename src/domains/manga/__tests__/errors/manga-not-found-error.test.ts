import { describe, expect, it } from 'vitest'
import { mangaNotFound } from '@manga/errors/manga-not-found-error'

describe('mangaNotFound', () => {
  it('creates a domain error with code and details', () => {
    const err = mangaNotFound(42)
    expect(err.code).toBe('MANGA_NOT_FOUND')
    expect(err.details).toEqual({ malId: 42 })
  })
})
