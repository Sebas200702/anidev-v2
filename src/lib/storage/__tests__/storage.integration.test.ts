/**
 * Integration tests for {@link module:lib/storage} against a real
 * S3-compatible backend.
 *
 * @module lib/storage/__tests__/storage.integration
 * @remarks
 * Opt-in with `RUN_DB_TESTS`; needs the `storage` compose profile (MinIO with
 * the public-read bucket from `minio-init`) and the `S3_*` variables. Proves
 * the anonymous public GET the profile routes rely on, and that deletes
 * really remove the object.
 */
import { randomUUID } from 'node:crypto'
import { beforeAll, describe, expect, it } from 'vitest'

const enabled = !!process.env.RUN_DB_TESTS

describe.skipIf(!enabled)('storage (integration)', () => {
  let storage: typeof import('@lib/storage')

  beforeAll(async () => {
    await import('dotenv/config')
    storage = await import('@lib/storage')
  })

  it('puts a public immutable object and deletes it', async () => {
    const key = `integration/${randomUUID()}.webp`
    const bytes = new TextEncoder().encode('integration')
    await storage.putObject(key, bytes, 'image/webp')

    const stored = await fetch(storage.publicUrl(key))
    expect(stored.status).toBe(200)
    expect(stored.headers.get('content-type')).toBe('image/webp')
    expect(stored.headers.get('cache-control')).toContain('immutable')
    expect(new Uint8Array(await stored.arrayBuffer())).toEqual(bytes)

    await storage.deleteObject(key)
    const gone = await fetch(storage.publicUrl(key))
    expect(gone.status).toBe(404)
  })
})
