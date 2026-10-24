import { describe, expect, it } from 'vitest'
import { mapWatchProgressEntry } from '@user/mappers/watch-progress'

describe('mapWatchProgressEntry', () => {
  it('maps row to api entry', () => {
    const entry = mapWatchProgressEntry({
      userId: 'u1',
      animeId: 2,
      episodeId: 5,
      progressSeconds: 100,
      durationSeconds: 200,
      completed: false,
      watchedAt: new Date('2020-01-02T00:00:00.000Z'),
      updatedAt: new Date('2020-01-02T00:00:00.000Z'),
    } as any)
    expect(entry.animeId).toBe(2)
    expect(entry.episodeId).toBe(5)
    expect(entry.progressSeconds).toBe(100)
    expect(entry.completed).toBe(false)
  })
})
