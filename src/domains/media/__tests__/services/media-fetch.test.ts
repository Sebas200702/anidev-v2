/**
 * Tests for {@link fetchMediaAsset}.
 *
 * @module domains/media/__tests__/services/media-fetch
 * @remarks
 * Mocks the global `fetch` to cover the success path (buffer + normalized mime type), the non-OK
 * response {@link InfraError}, and the wrapped network-failure error. Follows the repo
 * TDD/unit-test layout.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { InfraError } from '@shared/errors/app-error'
import { ErrorCodes } from '@shared/errors/codes'
import { fetchMediaAsset } from '@media/services/media-fetch'

const fetchMock = vi.fn()

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

describe('fetchMediaAsset', () => {
  it('returns the buffer and normalized mime type on success', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'image/webp; charset=utf-8' }),
      arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
    })

    const result = await fetchMediaAsset('https://cdn/x.webp')

    expect(result.mimeType).toBe('image/webp')
    expect(result.buffer).toBeInstanceOf(Buffer)
    expect(result.buffer).toHaveLength(3)
  })

  it('falls back to octet-stream when content-type is absent', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      headers: new Headers(),
      arrayBuffer: async () => new ArrayBuffer(0),
    })

    const result = await fetchMediaAsset('https://cdn/x')
    expect(result.mimeType).toBe('application/octet-stream')
  })

  it('throws an InfraError for a non-OK response', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      headers: new Headers(),
      arrayBuffer: async () => new ArrayBuffer(0),
    })

    await expect(fetchMediaAsset('https://cdn/missing')).rejects.toBeInstanceOf(
      InfraError
    )
  })

  it('wraps network failures as an EXTERNAL_API_ERROR InfraError', async () => {
    fetchMock.mockRejectedValue(new Error('ECONNREFUSED'))

    await expect(fetchMediaAsset('https://cdn/x')).rejects.toMatchObject({
      code: ErrorCodes.EXTERNAL_API_ERROR,
    })
  })
})
