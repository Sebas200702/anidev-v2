/**
 * Unit tests for the internal `artistIds` scope of the music list.
 *
 * @module domains/music/__tests__/repositories/music-list-artist-scope
 */
import { describe, expect, it, vi } from 'vitest'

vi.mock('@config/env', () => ({
  env: { DATABASE_URL: 'postgres://test:test@localhost:5432/test' },
}))

const { and } = await import('drizzle-orm')
const { db } = await import('@db/client')
const { music } = await import('@db/schemas/music')
const { buildMusicListFilters } = await import('@music/repositories/music-list')

describe('buildMusicListFilters — artist scope', () => {
  it('restricts to themes credited to the artists', () => {
    const { sql, params } = db
      .select()
      .from(music)
      .where(and(...buildMusicListFilters({ artistIds: [3, 4] })))
      .toSQL()
    expect(sql).toContain('"music_artist"')
    expect(params).toEqual(expect.arrayContaining([3, 4]))
  })

  it('matches nothing for an empty artist list', () => {
    const { sql } = db
      .select()
      .from(music)
      .where(and(...buildMusicListFilters({ artistIds: [] })))
      .toSQL()
    expect(sql).toContain('false')
  })
})
