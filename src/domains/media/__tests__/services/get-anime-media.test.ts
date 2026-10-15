/**
 * Tests for {@link getAnimeMedia} and the {@link mediaService} aggregator.
 *
 * @module domains/media/__tests__/services/get-anime-media
 * @remarks
 * `getAnimeMedia` is a thin repository passthrough; the aggregator test asserts the public method
 * surface is wired. Follows the repo TDD/unit-test layout.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@config/env', () => ({
  env: {
    NODE_ENV: 'test',
    LOG_LEVEL: 'silent',
    APP_BASE_URL: 'http://localhost',
  },
}))

const { getMediaByAnimeId, getMediaByAnimeIds } = vi.hoisted(() => ({
  getMediaByAnimeId: vi.fn(),
  getMediaByAnimeIds: vi.fn(),
}))
vi.mock('@media/repositories/anime-media', () => ({
  animeMediaRepository: { getMediaByAnimeId, getMediaByAnimeIds },
}))

import {
  getAnimeMedia,
  getAnimeMediaByIds,
} from '@media/services/get-anime-media'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getAnimeMedia', () => {
  it('delegates to the repository by anime id', async () => {
    getMediaByAnimeId.mockResolvedValue([{ id: 1 }])

    const result = await getAnimeMedia(5114)

    expect(getMediaByAnimeId).toHaveBeenCalledWith(5114)
    expect(result).toEqual([{ id: 1 }])
  })
})

describe('getAnimeMediaByIds', () => {
  it('groups flat rows by anime id', async () => {
    getMediaByAnimeIds.mockResolvedValue([
      { id: 1, animeId: 5114, mediaType: 'banner', src: 'b', size: null },
      { id: 2, animeId: 9253, mediaType: 'poster', src: 'p', size: null },
      { id: 3, animeId: 5114, mediaType: 'poster', src: 'p2', size: null },
    ])

    const result = await getAnimeMediaByIds([5114, 9253])

    expect(getMediaByAnimeIds).toHaveBeenCalledWith([5114, 9253])
    expect(result[5114]).toHaveLength(2)
    expect(result[9253]).toHaveLength(1)
    expect(result[5114][0]).not.toHaveProperty('animeId')
  })

  it('returns an empty record without querying for no ids', async () => {
    await expect(getAnimeMediaByIds([])).resolves.toEqual({})
    expect(getMediaByAnimeIds).not.toHaveBeenCalled()
  })
})
