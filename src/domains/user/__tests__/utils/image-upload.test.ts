import { describe, expect, it } from 'vitest'
import { readImageUpload } from '@user/utils/image-upload'

const MiB = 1024 * 1024

const upload = (fields: Record<string, string | Blob>) => {
  const form = new FormData()
  for (const [name, value] of Object.entries(fields)) form.append(name, value)
  return new Request('http://localhost/api/user/u1/avatar', {
    method: 'PUT',
    body: form,
  })
}

const file = (size = 10) => new File([new Uint8Array(size)], 'a.png')

describe('readImageUpload', () => {
  it('returns the file bytes and no crop', async () => {
    const result = await readImageUpload(upload({ file: file(10) }))
    expect(result.bytes.byteLength).toBe(10)
    expect(result.crop).toBeUndefined()
  })

  it('parses a complete crop box', async () => {
    const result = await readImageUpload(
      upload({ file: file(), x: '0', y: '5', width: '100', height: '120' })
    )
    expect(result.crop).toEqual({ x: 0, y: 5, width: 100, height: 120 })
  })

  it.each([
    [{ x: '0', y: '0', width: '100' }],
    [{ x: '-1', y: '0', width: '100', height: '100' }],
    [{ x: '0', y: '0', width: '8', height: '100' }],
    [{ x: '0.5', y: '0', width: '100', height: '100' }],
  ])('rejects an invalid crop %o with 400', async (crop) => {
    await expect(
      readImageUpload(upload({ file: file(), ...crop }))
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' })
  })

  it('rejects a missing or empty file part with 400', async () => {
    await expect(
      readImageUpload(upload({ file: 'text' }))
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' })
    await expect(
      readImageUpload(upload({ file: file(0) }))
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' })
  })

  it('rejects a body that is not multipart with 415', async () => {
    const json = new Request('http://localhost/', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    })
    await expect(readImageUpload(json)).rejects.toMatchObject({
      code: 'UNSUPPORTED_MEDIA_TYPE',
    })
  })

  it('rejects a declared Content-Length over the cap with 413', async () => {
    const request = upload({ file: file() })
    request.headers.set('content-length', String(6 * MiB))
    await expect(readImageUpload(request)).rejects.toMatchObject({
      code: 'REQUEST_TOO_LARGE',
    })
  })

  it('rejects a file over 5 MiB with 413', async () => {
    await expect(
      readImageUpload(upload({ file: file(5 * MiB + 1) }))
    ).rejects.toMatchObject({ code: 'REQUEST_TOO_LARGE' })
  })
})
