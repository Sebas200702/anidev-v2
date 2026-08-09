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

vi.mock('@media/services/media-service', () => ({
  mediaService: mediaServiceMock,
}))

vi.mock('@config/env', () => ({
  env: {
    NODE_ENV: 'production',
    LOG_LEVEL: 'info',
    SENTRY_DSN: undefined,
  },
}))

import { GET } from '../[...path]'

const createContext = (path: string) =>
  ({
    request: new Request(`http://localhost:4321/media/${path}`),
    params: { path },
  }) as unknown as Parameters<typeof GET>[0]

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
})
