/**
 * Tests for the media proxy route (`GET /media/[...path]`).
 *
 * @module pages/media/__tests__/media-route
 * @remarks
 * The route container delegates to {@link module:media/services/media-service}; this
 * spec mocks that facade to exercise the route's branching and error handling in
 * isolation. `src/config/env.ts` validates eagerly at import, so it is mocked (the
 * runner does not load `.env`). A malformed semantic path must surface as a client
 * error (400), never as an `InfraError` 503.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest'

const mediaServiceMock = vi.hoisted(() => ({
  parsePath: vi.fn(),
  resolveMedia: vi.fn(),
  optimizeMedia: vi.fn(),
  fetchRawMedia: vi.fn(),
  fetchImageBuffer: vi.fn(),
}))

vi.mock('@media/services/media', () => ({
  mediaService: mediaServiceMock,
}))

vi.mock('@config/env', () => ({
  env: {
    NODE_ENV: 'production',
    APP_BASE_URL: 'http://localhost:4321',
    LOG_LEVEL: 'info',
    SENTRY_DSN: undefined,
  },
}))

import { GET } from '../[...path]'

const createContext = (path: string, headers?: Record<string, string>) =>
  ({
    request: new Request(`http://localhost:4321/media/${path}`, {
      headers,
    }),
    params: { path },
  }) as unknown as Parameters<typeof GET>[0]

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
  src: 'https://cdn/song.mp3',
})

beforeEach(() => {
  vi.clearAllMocks()
})

describe('GET /media/[...path]', () => {
  it('responds 400 for a malformed path instead of calling the optimization pipeline', async () => {
    mediaServiceMock.parsePath.mockReturnValue(null)

    const response = await GET(createContext('anime/abc/poster'))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({
      data: null,
      status: 400,
      error: 'Invalid media path',
    })
    expect(mediaServiceMock.optimizeMedia).not.toHaveBeenCalled()
    expect(mediaServiceMock.fetchRawMedia).not.toHaveBeenCalled()
  })

  it('streams raw media with hardening headers on 200', async () => {
    mediaServiceMock.parsePath.mockReturnValue({
      entityType: 'music',
      entityId: 1,
      mediaType: 'audio',
      mediaSize: 'default',
    })
    mediaServiceMock.fetchRawMedia.mockResolvedValue(streamResult('audio/mpeg'))

    const response = await GET(createContext('music/1/audio/default'))

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('audio/mpeg')
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
    expect(response.headers.get('Accept-Ranges')).toBe('bytes')
    expect(mediaServiceMock.fetchRawMedia).toHaveBeenCalledWith(
      expect.objectContaining({ entityId: 1 }),
      expect.objectContaining({ range: undefined })
    )
  })

  it('forwards Range and replies 206 with Content-Range', async () => {
    mediaServiceMock.parsePath.mockReturnValue({
      entityType: 'music',
      entityId: 1,
      mediaType: 'audio',
      mediaSize: 'default',
    })
    mediaServiceMock.fetchRawMedia.mockResolvedValue({
      ...streamResult('audio/mpeg', 206),
      contentRange: 'bytes 0-2/1000',
      contentLength: '3',
    })

    const response = await GET(
      createContext('music/1/audio/default', { range: 'bytes=0-2' })
    )

    expect(response.status).toBe(206)
    expect(response.headers.get('Content-Range')).toBe('bytes 0-2/1000')
    expect(response.headers.get('Accept-Ranges')).toBe('bytes')
    expect(mediaServiceMock.fetchRawMedia).toHaveBeenCalledWith(
      expect.objectContaining({ entityId: 1 }),
      expect.objectContaining({ range: 'bytes=0-2' })
    )
  })

  it('responds 200 with optimized image bytes for a valid non-raw path', async () => {
    mediaServiceMock.parsePath.mockReturnValue({
      entityType: 'anime',
      entityId: 5114,
      mediaType: 'poster',
      mediaSize: 'large',
    })
    mediaServiceMock.optimizeMedia.mockResolvedValue({
      buffer: new Uint8Array([1, 2, 3]),
      mimeType: 'image/webp',
    })

    const response = await GET(createContext('anime/5114/poster/large'))

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('image/webp')
    expect(mediaServiceMock.optimizeMedia).toHaveBeenCalledWith(
      expect.objectContaining({ entityId: 5114 }),
      expect.any(Object)
    )
  })

  it('serves episode thumbnails through the image pipeline, not the stream proxy', async () => {
    mediaServiceMock.parsePath.mockReturnValue({
      entityType: 'episode',
      entityId: 10,
      mediaType: 'thumbnail',
    })
    mediaServiceMock.optimizeMedia.mockResolvedValue({
      buffer: new Uint8Array([1, 2, 3]),
      mimeType: 'image/webp',
    })

    const response = await GET(createContext('episode/10/thumbnail'))

    expect(response.status).toBe(200)
    expect(mediaServiceMock.optimizeMedia).toHaveBeenCalled()
    expect(mediaServiceMock.fetchRawMedia).not.toHaveBeenCalled()
  })
})
