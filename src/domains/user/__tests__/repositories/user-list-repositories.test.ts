import { beforeEach, describe, expect, it, vi } from 'vitest'
import { InfraError } from '@shared/errors/app-error'
import {
  chainResolving,
  throwOnQuery,
} from '@shared/__tests__/helpers/drizzle-mock'

vi.mock('@config/env', () => ({
  env: { NODE_ENV: 'test', LOG_LEVEL: 'silent' },
}))

const { select, insert, deleteFn } = vi.hoisted(() => ({
  select: vi.fn(),
  insert: vi.fn(),
  deleteFn: vi.fn(),
}))
vi.mock('@db/client', () => ({ db: { select, insert, delete: deleteFn } }))

const { userListRepository } = await import('@user/repositories/user-list')
const { watchProgressRepository } = await import(
  '@user/repositories/watch-progress'
)

beforeEach(() => {
  vi.clearAllMocks()
  select.mockReturnValue(chainResolving([]))
  insert.mockReturnValue(chainResolving([]))
  deleteFn.mockReturnValue(chainResolving([]))
})

describe('userListRepository', () => {
  it('returns list', async () => {
    select.mockReturnValue(chainResolving([{ animeId: 1 }]))
    const rows = await userListRepository.getUserList('u1')
    expect(Array.isArray(rows)).toBe(true)
  })

  it('upserts entry', async () => {
    insert.mockReturnValue(
      chainResolving([
        {
          userId: 'u1',
          animeId: 1,
          status: 'watching',
          isFavorite: false,
          score: null,
          addedAt: new Date(),
          updatedAt: new Date(),
        },
      ])
    )
    const row = await userListRepository.upsertUserList('u1', {
      animeId: 1,
      status: 'watching',
      isFavorite: false,
    } as any)
    expect(row.animeId).toBe(1)
  })

  it('deletes and returns snapshot or null', async () => {
    deleteFn.mockReturnValue(
      chainResolving([
        {
          userId: 'u1',
          animeId: 1,
          status: 'watching',
          isFavorite: false,
          score: null,
          addedAt: new Date(),
          updatedAt: new Date(),
        },
      ])
    )
    const snap = await userListRepository.deleteUserList('u1', 1)
    expect(snap).not.toBeNull()

    deleteFn.mockReturnValue(chainResolving([]))
    const none = await userListRepository.deleteUserList('u1', 2)
    expect(none).toBeNull()
  })

  it('wraps errors', async () => {
    select.mockImplementation(throwOnQuery)
    await expect(userListRepository.getUserList('u1')).rejects.toBeInstanceOf(
      InfraError
    )
    insert.mockImplementation(throwOnQuery)
    await expect(
      userListRepository.upsertUserList('u1', {
        animeId: 1,
        status: 'watching',
        isFavorite: false,
      } as any)
    ).rejects.toBeInstanceOf(InfraError)
    deleteFn.mockImplementation(throwOnQuery)
    await expect(
      userListRepository.deleteUserList('u1', 1)
    ).rejects.toBeInstanceOf(InfraError)
  })
})

describe('watchProgressRepository', () => {
  it('returns progress list', async () => {
    select.mockReturnValue(chainResolving([{ animeId: 1 }]))
    const rows = await watchProgressRepository.getWatchProgress('u1')
    expect(Array.isArray(rows)).toBe(true)
  })

  it('upserts progress', async () => {
    insert.mockReturnValue(
      chainResolving([
        {
          userId: 'u1',
          animeId: 1,
          episodeId: null,
          progressSeconds: 10,
          durationSeconds: null,
          completed: false,
          updatedAt: new Date(),
        },
      ])
    )
    const row = await watchProgressRepository.upsertWatchProgress(
      'u1',
      { animeId: 1, progressSeconds: 10 } as any,
      false
    )
    expect(row.animeId).toBe(1)
  })

  it('wraps errors', async () => {
    select.mockImplementation(throwOnQuery)
    await expect(
      watchProgressRepository.getWatchProgress('u1')
    ).rejects.toBeInstanceOf(InfraError)
    insert.mockImplementation(throwOnQuery)
    await expect(
      watchProgressRepository.upsertWatchProgress(
        'u1',
        { animeId: 1, progressSeconds: 10 } as any,
        false
      )
    ).rejects.toBeInstanceOf(InfraError)
  })
})
