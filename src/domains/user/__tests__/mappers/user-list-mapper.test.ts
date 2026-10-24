import { describe, expect, it } from 'vitest'
import { mapUserListEntry } from '@user/mappers/user-list'

describe('mapUserListEntry', () => {
  it('maps row to api entry', () => {
    const entry = mapUserListEntry({
      userId: 'u1',
      animeId: 1,
      status: 'watching',
      isFavorite: true,
      score: 8,
      addedAt: new Date('2020-01-01T00:00:00.000Z'),
      updatedAt: new Date('2020-01-02T00:00:00.000Z'),
    } as any)
    expect(entry.animeId).toBe(1)
    expect(entry.status).toBe('watching')
    expect(entry.isFavorite).toBe(true)
    expect(entry.score).toBe(8)
    expect(entry.addedAt).toBe('2020-01-01T00:00:00.000Z')
  })
})
