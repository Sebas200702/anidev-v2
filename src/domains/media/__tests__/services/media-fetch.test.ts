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
import { DomainError, InfraError } from '@shared/errors/app-error'
import { ErrorCodes } from '@shared/errors/codes'
import { fetchMediaAsset, fetchMediaStream } from '@media/services/media-fetch'

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

  it('rejects unsafe URLs as DomainError without calling fetch', async () => {
    await expect(fetchMediaAsset('http://cdn/x.webp')).rejects.toBeInstanceOf(
      DomainError
    )
    await expect(
      fetchMediaAsset('https://127.0.0.1/x.webp')
    ).rejects.toBeInstanceOf(DomainError)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('revalidates redirect targets and rejects unsafe final URLs', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      url: 'http://169.254.169.254/latest/meta-data',
      headers: new Headers({ 'content-type': 'image/webp' }),
      arrayBuffer: async () => new ArrayBuffer(0),
    })

    await expect(
      fetchMediaAsset('https://cdn.example/x.webp')
    ).rejects.toBeInstanceOf(DomainError)
  })

  it('aborts oversized payloads with EXTERNAL_API_ERROR', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      url: 'https://cdn.example/x.webp',
      headers: new Headers({ 'content-type': 'image/webp' }),
      arrayBuffer: async () => new ArrayBuffer(26 * 1024 * 1024),
    })

    await expect(
      fetchMediaAsset('https://cdn.example/x.webp')
    ).rejects.toMatchObject({ code: ErrorCodes.EXTERNAL_API_ERROR })
  })

  it('uses an 8s timeout by default', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      url: 'https://cdn.example/x.webp',
      headers: new Headers({ 'content-type': 'image/webp' }),
      arrayBuffer: async () => new ArrayBuffer(0),
    })

    await fetchMediaAsset('https://cdn.example/x.webp')

    const signal = fetchMock.mock.calls[0][1].signal as AbortSignal
    expect(signal).toBeInstanceOf(AbortSignal)
  })
})

const streamOf = (bytes: number[]) =>
  new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new Uint8Array(bytes))
      controller.close()
    },
  })

describe('fetchMediaStream', () => {
  it('forwards the client Range header upstream', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 206,
      url: 'https://cdn.example/song.mp3',
      headers: new Headers({
        'content-type': 'audio/mpeg',
        'content-range': 'bytes 0-99/1000',
        'content-length': '100',
      }),
      body: streamOf([1, 2, 3]),
    })

    const result = await fetchMediaStream('https://cdn.example/song.mp3', {
      range: 'bytes=0-99',
    })

    expect(fetchMock.mock.calls[0][1].headers.Range).toBe('bytes=0-99')
    expect(result.status).toBe(206)
    expect(result.contentRange).toBe('bytes 0-99/1000')
    expect(result.contentLength).toBe('100')
    expect(result.mimeType).toBe('audio/mpeg')
    const chunks: Uint8Array[] = []
    const reader = result.stream.getReader()
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      if (value) chunks.push(value)
    }
    expect(chunks).toHaveLength(1)
  })

  it('rejects unsafe URLs as DomainError without calling fetch', async () => {
    await expect(
      fetchMediaStream('https://127.0.0.1/song.mp3')
    ).rejects.toBeInstanceOf(DomainError)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('rejects unsafe redirect targets as DomainError', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      url: 'http://169.254.169.254/x',
      headers: new Headers({ 'content-type': 'image/webp' }),
      body: streamOf([1]),
    })

    await expect(
      fetchMediaStream('https://cdn.example/x.webp')
    ).rejects.toBeInstanceOf(DomainError)
  })

  it('fails when the upstream response has no body', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      url: 'https://cdn.example/x.webp',
      headers: new Headers({ 'content-type': 'image/webp' }),
      body: null,
    })

    await expect(
      fetchMediaStream('https://cdn.example/x.webp')
    ).rejects.toMatchObject({ code: ErrorCodes.EXTERNAL_API_ERROR })
  })

  it('aborts a declared over-budget content-length with EXTERNAL_API_ERROR', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      url: 'https://cdn.example/big.mp3',
      headers: new Headers({
        'content-type': 'audio/mpeg',
        'content-length': String(26 * 1024 * 1024),
      }),
      body: streamOf([1]),
    })

    await expect(
      fetchMediaStream('https://cdn.example/big.mp3')
    ).rejects.toMatchObject({ code: ErrorCodes.EXTERNAL_API_ERROR })
  })

  it('aborts mid-stream when an unknown-length body exceeds the budget', async () => {
    const big = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(26 * 1024 * 1024))
        controller.close()
      },
    })
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      url: 'https://cdn.example/big.mp3',
      headers: new Headers({ 'content-type': 'audio/mpeg' }),
      body: big,
    })

    const result = await fetchMediaStream('https://cdn.example/big.mp3')
    await expect(
      (async () => {
        const reader = result.stream.getReader()
        for (;;) {
          const { done } = await reader.read()
          if (done) break
        }
      })()
    ).rejects.toBeInstanceOf(InfraError)
  })
})
