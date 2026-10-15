/**
 * Tests for the bounded disk LRU ({@link disk-store}).
 *
 * @module domains/media/__tests__/cache/disk-store
 * @remarks
 * Uses real temporary directories (isolated per test) to prove byte
 * round-trips, miss/corruption handling, and oldest-first eviction under a
 * tiny budget. Follows the repo TDD/unit-test layout.
 */
import { createHash } from 'node:crypto'
import { mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@config/env', () => ({
  env: { NODE_ENV: 'test', LOG_LEVEL: 'silent' },
}))

import {
  enforceDiskBudget,
  readOptimizedDisk,
  writeOptimizedDisk,
} from '@media/cache/media-cache/disk-store'

let dir: string

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'anidev-disk-test-'))
})

afterEach(async () => {
  await rm(dir, { recursive: true, force: true })
})

describe('disk-store', () => {
  it('round-trips bytes and MIME type', async () => {
    await writeOptimizedDisk(
      'k1',
      { buffer: Buffer.from('hello'), mimeType: 'image/webp' },
      dir
    )

    const result = await readOptimizedDisk('k1', dir)
    expect(result?.buffer.toString()).toBe('hello')
    expect(result?.mimeType).toBe('image/webp')
  })

  it('returns null for a missing key', async () => {
    await expect(readOptimizedDisk('absent', dir)).resolves.toBeNull()
  })

  it('returns null and cleans up on corrupt metadata', async () => {
    await writeOptimizedDisk(
      'k2',
      { buffer: Buffer.from('x'), mimeType: 'image/webp' },
      dir
    )
    const file = join(dir, createHash('sha256').update('k2').digest('hex'))
    expect(await readdir(dir)).toHaveLength(2)
    await writeFile(`${file}.meta`, '{bad', 'utf-8')

    await expect(readOptimizedDisk('k2', dir)).resolves.toBeNull()
    expect(await readFile(file).catch(() => null)).toBeNull()
  })

  it('evicts least-recently-modified entries over budget', async () => {
    await writeOptimizedDisk(
      'old',
      { buffer: Buffer.from('a'.repeat(40)), mimeType: 'image/webp' },
      dir
    )
    await writeOptimizedDisk(
      'new',
      { buffer: Buffer.from('b'.repeat(40)), mimeType: 'image/webp' },
      dir
    )

    await enforceDiskBudget(dir, 50)

    await expect(readOptimizedDisk('old', dir)).resolves.toBeNull()
    const kept = await readOptimizedDisk('new', dir)
    expect(kept?.buffer.toString()).toBe('b'.repeat(40))
  })
})
