import { describe, expect, it } from 'vitest'
import { readBoundedBytes } from '@shared/http/read-bounded-bytes'

const chunked = (...chunks: number[]) =>
  new Request('http://localhost/', {
    method: 'PUT',
    body: new ReadableStream({
      start(controller) {
        for (const size of chunks) controller.enqueue(new Uint8Array(size))
        controller.close()
      },
    }),
    duplex: 'half',
  } as RequestInit)

describe('readBoundedBytes', () => {
  it('returns every byte under the cap', async () => {
    const bytes = await readBoundedBytes(chunked(3, 4), 10)
    expect(bytes.byteLength).toBe(7)
  })

  it('returns an empty array without a body', async () => {
    const bytes = await readBoundedBytes(new Request('http://localhost/'), 10)
    expect(bytes.byteLength).toBe(0)
  })

  it('throws REQUEST_TOO_LARGE once a chunked body passes the cap', async () => {
    await expect(readBoundedBytes(chunked(6, 6), 10)).rejects.toMatchObject({
      code: 'REQUEST_TOO_LARGE',
    })
  })
})
