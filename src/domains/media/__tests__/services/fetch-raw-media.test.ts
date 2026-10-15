/**
 * Tests for {@link fetchRawMedia} streaming delivery.
 *
 * @module domains/media/__tests__/services/fetch-raw-media
 * @remarks
 * Covers the null-path {@link DomainError}, the placeholder {@link DomainError}
 * (`MEDIA_NOT_FOUND`), MIME allowlist rejection, and Range passthrough. The
 * media cache, resolver, and stream fetcher are mocked; no filesystem or
 * network access occurs. Follows the repo TDD/unit-test layout.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DomainError } from '@shared/errors/app-error'
import { ErrorCodes } from '@shared/errors/codes'
import { MediaEntity, MediaSize, MediaType } from '@media/types/media-enums'

vi.mock('@media/config', () => ({
  mediaServiceConfig: {
    defaultPlaceholderUrl: 'http://localhost/placeholder.webp',
  },
}))

const { getRawMeta, setRawMeta, resolveMedia, fetchMediaStream } = vi.hoisted(
  () => ({
    getRawMeta: vi.fn(),
    setRawMeta: vi.fn(),
    resolveMedia: vi.fn(),
    fetchMediaStream: vi.fn(),
  })
)
vi.mock('@media/cache/media-cache', () => ({
  mediaCache: { getRawMeta, setRawMeta },
}))
vi.mock('@media/services/resolve-media', () => ({ resolveMedia }))
vi.mock('@media/services/media-fetch', () => ({ fetchMediaStream }))

import type { SemanticMediaPath } from '@media/types/media-asset-types'
import { fetchRawMedia } from '@media/services/fetch-raw-media'

const path: SemanticMediaPath = {
  entityType: MediaEntity.MUSIC,
  entityId: 1,
  mediaType: MediaType.POSTER,
  mediaSize: MediaSize.DEFAULT,
  mediaId: 1,
}

const streamResult = (mimeType: string, status = 200) => ({
  stream: new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new Uint8Array([1, 2, 3]))
      controller.close()
    },
  }),
  mimeType,
  status,
  contentRange: null,
  contentLength: null,
})

beforeEach(() => {
  vi.clearAllMocks()
})

describe('fetchRawMedia', () => {
  it('throws a DomainError for a null path', async () => {
    await expect(fetchRawMedia(null)).rejects.toBeInstanceOf(DomainError)
  })

  it('throws MEDIA_NOT_FOUND when the resolved asset is the placeholder', async () => {
    getRawMeta.mockResolvedValue(null)
    resolveMedia.mockResolvedValue({ src: 'http://localhost/placeholder.webp' })

    await expect(fetchRawMedia(path)).rejects.toMatchObject({
      code: ErrorCodes.MEDIA_NOT_FOUND,
    })
    await expect(fetchRawMedia(path)).rejects.toBeInstanceOf(DomainError)
  })

  it('rejects text/html upstreams as DomainError', async () => {
    getRawMeta.mockResolvedValue(null)
    resolveMedia.mockResolvedValue({ src: 'https://cdn/page.html' })
    fetchMediaStream.mockResolvedValue(streamResult('text/html'))

    await expect(fetchRawMedia(path)).rejects.toBeInstanceOf(DomainError)
    await expect(fetchRawMedia(path)).rejects.toMatchObject({
      code: ErrorCodes.INVALID_IMAGE_PATH,
    })
  })

  it('streams without touching the filesystem and forwards Range', async () => {
    getRawMeta.mockResolvedValue(null)
    resolveMedia.mockResolvedValue({ src: 'https://cdn/song.mp3' })
    fetchMediaStream.mockResolvedValue({
      ...streamResult('audio/mpeg', 206),
      contentRange: 'bytes 0-2/1000',
      contentLength: '3',
    })

    const result = await fetchRawMedia(path, { range: 'bytes=0-2' })

    expect(fetchMediaStream).toHaveBeenCalledWith('https://cdn/song.mp3', {
      range: 'bytes=0-2',
    })
    expect(setRawMeta).toHaveBeenCalledWith(
      expect.objectContaining({ entityType: MediaEntity.MUSIC }),
      { src: 'https://cdn/song.mp3' }
    )
    expect(result.status).toBe(206)
    expect(result.contentRange).toBe('bytes 0-2/1000')
    expect(result.mimeType).toBe('audio/mpeg')
  })

  it('reuses the cached src without re-resolving', async () => {
    getRawMeta.mockResolvedValue({ src: 'https://cdn/cached.mp3' })
    fetchMediaStream.mockResolvedValue(streamResult('audio/mpeg'))

    const result = await fetchRawMedia(path)

    expect(resolveMedia).not.toHaveBeenCalled()
    expect(fetchMediaStream).toHaveBeenCalledWith('https://cdn/cached.mp3', {
      range: undefined,
    })
    expect(result.src).toBe('https://cdn/cached.mp3')
  })
})
