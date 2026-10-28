import { beforeEach, describe, expect, it, vi } from 'vitest'

const m = vi.hoisted(() => ({
  send: vi.fn(),
  clientConfig: vi.fn(),
}))

vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: class {
    constructor(config: unknown) {
      m.clientConfig(config)
    }
    send = m.send
  },
  PutObjectCommand: class {
    constructor(public input: unknown) {}
  },
  DeleteObjectCommand: class {
    constructor(public input: unknown) {}
  },
}))

vi.mock('@config/env', () => ({
  env: {
    S3_ENDPOINT: 'http://localhost:9000',
    S3_REGION: 'auto',
    S3_BUCKET: 'anidev-media',
    S3_ACCESS_KEY_ID: 'anidev',
    S3_SECRET_ACCESS_KEY: 'secret',
    S3_PUBLIC_URL: 'http://localhost:9000/anidev-media/',
    S3_FORCE_PATH_STYLE: true,
  },
}))

import { InfraError } from '@shared/errors'
import { deleteObject, publicUrl, putObject } from '@lib/storage'

beforeEach(() => {
  m.send.mockReset()
})

describe('storage', () => {
  it('puts an immutable object in the bucket with a lazy client', async () => {
    m.send.mockResolvedValue({})
    const bytes = new Uint8Array([1, 2, 3])
    await putObject('users/u1/avatar/a.webp', bytes, 'image/webp')
    await putObject('users/u1/avatar/b.webp', bytes, 'image/webp')

    expect(m.clientConfig).toHaveBeenCalledTimes(1)
    expect(m.clientConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: 'http://localhost:9000',
        region: 'auto',
        forcePathStyle: true,
        credentials: { accessKeyId: 'anidev', secretAccessKey: 'secret' },
      })
    )
    expect(m.send.mock.calls[0][0].input).toEqual({
      Bucket: 'anidev-media',
      Key: 'users/u1/avatar/a.webp',
      Body: bytes,
      ContentType: 'image/webp',
      CacheControl: 'public, max-age=31536000, immutable',
    })
  })

  it('wraps put failures in a STORAGE_ERROR infra error', async () => {
    m.send.mockRejectedValue(new Error('boom'))
    const failure = putObject('k', new Uint8Array(), 'image/webp')
    await expect(failure).rejects.toBeInstanceOf(InfraError)
    await expect(failure).rejects.toMatchObject({ code: 'STORAGE_ERROR' })
  })

  it('deletes an object by key', async () => {
    m.send.mockResolvedValue({})
    await deleteObject('users/u1/avatar/a.webp')
    expect(m.send.mock.calls[0][0].input).toEqual({
      Bucket: 'anidev-media',
      Key: 'users/u1/avatar/a.webp',
    })
  })

  it('wraps delete failures in a STORAGE_ERROR infra error', async () => {
    m.send.mockRejectedValue(new Error('boom'))
    await expect(deleteObject('k')).rejects.toMatchObject({
      code: 'STORAGE_ERROR',
    })
  })

  it('builds the public URL without a double slash', () => {
    expect(publicUrl('users/u1/avatar/a.webp')).toBe(
      'http://localhost:9000/anidev-media/users/u1/avatar/a.webp'
    )
  })
})
