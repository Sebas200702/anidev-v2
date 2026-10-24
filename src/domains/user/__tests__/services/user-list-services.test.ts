import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@config/env', () => ({
  env: { NODE_ENV: 'test', LOG_LEVEL: 'silent' },
}))

const { getList, upsert, remove } = vi.hoisted(() => ({
  getList: vi.fn(),
  upsert: vi.fn(),
  remove: vi.fn(),
}))
vi.mock('@user/repositories/user-list', () => ({
  userListRepository: {
    getUserList: getList,
    upsertUserList: upsert,
    deleteUserList: remove,
  },
}))

const { getProgress, upsertProgress } = vi.hoisted(() => ({
  getProgress: vi.fn(),
  upsertProgress: vi.fn(),
}))
vi.mock('@user/repositories/watch-progress', () => ({
  watchProgressRepository: {
    getWatchProgress: getProgress,
    upsertWatchProgress: upsertProgress,
  },
}))

vi.mock('@user/mappers/user-list', () => ({
  mapUserList: (rows: any[]) => rows.map((r) => ({ animeId: r.animeId })),
  mapUserListEntry: (row: any) => ({ animeId: row.animeId }),
}))
vi.mock('@user/mappers/watch-progress', () => ({
  mapWatchProgress: (rows: any[]) => rows.map((r) => ({ animeId: r.animeId })),
  mapWatchProgressEntry: (row: any) => ({ animeId: row.animeId }),
}))

import { userListService } from '@user/services/user-list'
import { watchProgressService } from '@user/services/watch-progress'

describe('userListService', () => {
  beforeEach(() => vi.clearAllMocks())

  it('lists entries', async () => {
    getList.mockResolvedValue([{ animeId: 1 }])
    const res = await userListService.list('u1')
    expect(res).toEqual([{ animeId: 1 }])
  })

  it('upserts entry', async () => {
    upsert.mockResolvedValue({ animeId: 1 })
    const res = await userListService.upsert('u1', {
      animeId: 1,
      status: 'watching',
      isFavorite: false,
    } as any)
    expect(res).toEqual({ animeId: 1 })
  })

  it('removes and returns snapshot or null', async () => {
    remove.mockResolvedValue({ animeId: 1 })
    expect(await userListService.remove('u1', 1)).toEqual({ animeId: 1 })
    remove.mockResolvedValue(null)
    expect(await userListService.remove('u1', 2)).toBeNull()
  })
})

describe('watchProgressService', () => {
  beforeEach(() => vi.clearAllMocks())

  it('lists entries', async () => {
    getProgress.mockResolvedValue([{ animeId: 2 }])
    const res = await watchProgressService.list('u1')
    expect(res).toEqual([{ animeId: 2 }])
  })

  it('upserts when newer', async () => {
    getProgress.mockResolvedValue([])
    upsertProgress.mockResolvedValue({
      animeId: 2,
      progressSeconds: 10,
      durationSeconds: 100,
      completed: false,
      episodeId: null,
      updatedAt: new Date(),
    })
    const res = await watchProgressService.upsert('u1', {
      animeId: 2,
      progressSeconds: 10,
      durationSeconds: 100,
    } as any)
    expect(res).toMatchObject({ animeId: 2 })
  })

  it('skips upsert when not newer', async () => {
    getProgress.mockResolvedValue([
      {
        animeId: 2,
        progressSeconds: 50,
        updatedAt: new Date(Date.now() + 10000),
      },
    ])
    const res = await watchProgressService.upsert('u1', {
      animeId: 2,
      progressSeconds: 10,
      durationSeconds: 100,
    } as any)
    expect(res).toMatchObject({ animeId: 2 })
    expect(upsertProgress).not.toHaveBeenCalled()
  })
})
