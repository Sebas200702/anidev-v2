/**
 * Tests for {@link fetchRawMedia}.
 *
 * @module domains/media/__tests__/services/fetch-raw-media
 * @remarks
 * Covers the null-path {@link InfraError}, the placeholder {@link DomainError} (`MEDIA_NOT_FOUND`),
 * the on-disk cache hit, and the fetch-and-persist path. `node:fs/promises`, the media cache,
 * resolver, and fetcher are mocked. Follows the repo TDD/unit-test layout.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DomainError, InfraError } from '@shared/errors/app-error'
import { ErrorCodes } from '@shared/errors/codes'
import { MediaEntity, MediaSize, MediaType } from '@media/types/media-enums'

vi.mock('@media/config', () => ({
  mediaServiceConfig: {
    defaultPlaceholderUrl: 'http://localhost/placeholder.webp',
  },
}))

const { mkdir, readFile, writeFile } = vi.hoisted(() => ({
  mkdir: vi.fn(),
  readFile: vi.fn(),
  writeFile: vi.fn(),
}))
vi.mock('node:fs/promises', () => ({ mkdir, readFile, writeFile }))

const { getRawMeta, setRawMeta, resolveMedia, fetchMediaAsset } = vi.hoisted(
  () => ({
    getRawMeta: vi.fn(),
    setRawMeta: vi.fn(),
    resolveMedia: vi.fn(),
    fetchMediaAsset: vi.fn(),
  })
)
vi.mock('@media/cache/media-cache', () => ({
  mediaCache: { getRawMeta, setRawMeta },
}))
vi.mock('@media/services/resolve-media', () => ({ resolveMedia }))
vi.mock('@media/services/media-fetch', () => ({ fetchMediaAsset }))

import type { SemanticMediaPath } from '@media/types/media-asset-types'
import { fetchRawMedia } from '@media/services/fetch-raw-media'

const path: SemanticMediaPath = {
  entityType: MediaEntity.MUSIC,
  entityId: 1,
  mediaType: MediaType.POSTER,
  mediaSize: MediaSize.DEFAULT,
  mediaId: 1,
}

beforeEach(() => {
  vi.clearAllMocks()
  mkdir.mockResolvedValue(undefined)
  writeFile.mockResolvedValue(undefined)
})

describe('fetchRawMedia', () => {
  it('throws an InfraError for a null path', async () => {
    await expect(fetchRawMedia(null)).rejects.toBeInstanceOf(InfraError)
  })

  it('throws MEDIA_NOT_FOUND when the resolved asset is the placeholder', async () => {
    getRawMeta.mockResolvedValue(null)
    resolveMedia.mockResolvedValue({ src: 'http://localhost/placeholder.webp' })

    await expect(fetchRawMedia(path)).rejects.toMatchObject({
      code: ErrorCodes.MEDIA_NOT_FOUND,
    })
    await expect(fetchRawMedia(path)).rejects.toBeInstanceOf(DomainError)
  })

  it('returns the on-disk cached bytes when present', async () => {
    getRawMeta.mockResolvedValue({ src: 'https://cdn/song.mp3' })
    readFile
      .mockResolvedValueOnce(Buffer.from('cached-bytes')) // cacheFile
      .mockResolvedValueOnce('audio/mpeg') // cacheMeta

    const result = await fetchRawMedia(path)

    expect(result).toEqual({
      buffer: Buffer.from('cached-bytes'),
      mimeType: 'audio/mpeg',
    })
    expect(fetchMediaAsset).not.toHaveBeenCalled()
  })

  it('fetches and persists when nothing is cached on disk', async () => {
    getRawMeta.mockResolvedValue(null)
    resolveMedia.mockResolvedValue({ src: 'https://cdn/song.mp3' })
    readFile.mockRejectedValue(new Error('ENOENT'))
    fetchMediaAsset.mockResolvedValue({
      buffer: Buffer.from('fresh'),
      mimeType: 'audio/mpeg',
    })

    const result = await fetchRawMedia(path)

    expect(fetchMediaAsset).toHaveBeenCalledWith('https://cdn/song.mp3')
    expect(setRawMeta).toHaveBeenCalledWith(
      expect.objectContaining({ entityType: MediaEntity.MUSIC }),
      { src: 'https://cdn/song.mp3' }
    )
    expect(writeFile).toHaveBeenCalled()
    expect(result).toEqual({
      buffer: Buffer.from('fresh'),
      mimeType: 'audio/mpeg',
    })
  })
})
