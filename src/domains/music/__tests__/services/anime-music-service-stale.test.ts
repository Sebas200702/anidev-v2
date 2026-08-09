/**
 * Integration test for stale-serve adoption in the anime-music service.
 *
 * @module domains/music/__tests__/services/anime-music-service-stale
 * @remarks
 * Verifies the graceful-degradation contract end-to-end through
 * {@link getMusicByAnimeId}: DB down with a `:stale` snapshot → stale serve;
 * DB down without a snapshot → rethrow; cache hit skips the repository;
 * successful compute writes both keys with the expected TTLs.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { dbError } from '@shared/errors/db-errors'
import { ErrorCodes } from '@shared/errors/codes'

vi.mock('@config/env', () => ({
  env: {
    NODE_ENV: 'test',
    DATABASE_URL: 'postgres://test:test@localhost:5432/test',
    REDIS_URL: 'redis://localhost:6379',
    APP_BASE_URL: 'http://localhost:4321',
    BETTER_AUTH_SECRET: 'test-secret-test-secret-test-secret-test-secret',
    SENTRY_DSN: undefined,
    LOG_LEVEL: 'silent',
  },
}))

const { getMock, setMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
  setMock: vi.fn(),
}))

vi.mock('@lib/cache/client', () => ({
  redis: {
    get: getMock,
    set: setMock,
  },
}))

const { findMusicByAnimeIdMock } = vi.hoisted(() => ({
  findMusicByAnimeIdMock: vi.fn(),
}))

vi.mock('@music/repositories/anime-music', () => ({
  animeMusicRepository: {
    findMusicByAnimeId: findMusicByAnimeIdMock,
  },
}))

import { getMusicByAnimeId } from '@music/services/anime-music'
import { CacheTtl } from '@lib/cache/config'

const TRACKS = [
  { id: 1, title: 'Tank!', type: 'OP' },
  { id: 2, title: 'The Real Folk Blues', type: 'ED' },
]

describe('getMusicByAnimeId stale-serve degradation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    findMusicByAnimeIdMock.mockResolvedValue(TRACKS)
    setMock.mockResolvedValue('OK')
  })

  it('serves a cache hit with isStale: false without touching the repository', async () => {
    getMock.mockResolvedValueOnce(JSON.stringify(TRACKS))

    const result = await getMusicByAnimeId(5114)

    expect(result).toEqual({ value: TRACKS, isStale: false })
    expect(findMusicByAnimeIdMock).not.toHaveBeenCalled()
  })

  it('serves the stale snapshot with isStale: true when the DB is down', async () => {
    getMock
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(JSON.stringify(TRACKS))
    findMusicByAnimeIdMock.mockRejectedValueOnce(
      dbError('[MUSIC_BY_ANIME_ID]', { animeId: 5114 })
    )

    const result = await getMusicByAnimeId(5114)

    expect(result).toEqual({ value: TRACKS, isStale: true })
    expect(getMock).toHaveBeenNthCalledWith(1, 'music:anime:5114')
    expect(getMock).toHaveBeenNthCalledWith(2, 'music:anime:5114:stale')
  })

  it('rethrows InfraError when the DB is down and no snapshot exists', async () => {
    getMock.mockResolvedValueOnce(null).mockResolvedValueOnce(null)
    findMusicByAnimeIdMock.mockRejectedValueOnce(
      dbError('[MUSIC_BY_ANIME_ID]', { animeId: 5114 })
    )

    await expect(getMusicByAnimeId(5114)).rejects.toMatchObject({
      code: ErrorCodes.DB_ERROR,
    })
  })

  it('bypasses a degraded cache and fetches from the database', async () => {
    getMock.mockRejectedValueOnce(new Error('cache connection refused'))

    const result = await getMusicByAnimeId(5114)

    expect(result).toEqual({ value: TRACKS, isStale: false })
    expect(findMusicByAnimeIdMock).toHaveBeenCalledWith(5114)
    expect(setMock).toHaveBeenCalledWith(
      'music:anime:5114',
      JSON.stringify(TRACKS),
      'EX',
      CacheTtl.Medium
    )
  })

  it('writes the stale snapshot with CacheTtl.Stale after a successful compute', async () => {
    getMock.mockResolvedValueOnce(null)

    await getMusicByAnimeId(5114)

    expect(setMock).toHaveBeenCalledWith(
      'music:anime:5114:stale',
      JSON.stringify(TRACKS),
      'EX',
      CacheTtl.Stale
    )
  })
})
