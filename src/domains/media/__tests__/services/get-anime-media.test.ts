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

const { getMediaByAnimeId } = vi.hoisted(() => ({ getMediaByAnimeId: vi.fn() }))
vi.mock('@media/repositories/anime-media', () => ({
  animeMediaRepository: { getMediaByAnimeId },
}))

import { getAnimeMedia } from '@media/services/get-anime-media'

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
