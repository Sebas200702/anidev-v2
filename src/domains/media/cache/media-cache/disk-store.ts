/**
 * @module domains/media/cache/media-cache/disk-store
 * @remarks Bounded local-disk LRU for optimized image bytes. Entries are raw
 * bytes plus a JSON sidecar (`<sha256>.meta` with `{ mimeType }`); when the
 * directory exceeds {@link OPTIMIZED_DISK_BUDGET_BYTES} the least recently
 * modified entries are evicted first. All operations are best-effort: disk
 * failures degrade to cache misses (logged) and never break responses.
 */
import { createHash } from 'node:crypto'
import {
  mkdir,
  readdir,
  readFile,
  stat,
  unlink,
  writeFile,
} from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { logger } from '@utils/logger-util'
import type { OptimizedMedia } from '@media/types/media-types'

/** Maximum optimized-image disk usage in bytes (512 MiB). */
export const OPTIMIZED_DISK_BUDGET_BYTES = 512 * 1024 * 1024

/** Directory holding cached optimized images. */
export const optimizedDiskDir = (): string => join(tmpdir(), 'anidev-optimized')

const fileFor = (dir: string, cacheKey: string): string =>
  join(dir, createHash('sha256').update(cacheKey).digest('hex'))

/**
 * Reads an optimized image from disk.
 *
 * @param cacheKey - Pre-built cache key
 * @param dir - Cache directory (defaults to {@link optimizedDiskDir})
 * @returns Cached {@link OptimizedMedia} or `null` on miss/corruption
 */
export const readOptimizedDisk = async (
  cacheKey: string,
  dir: string = optimizedDiskDir()
): Promise<OptimizedMedia | null> => {
  const file = fileFor(dir, cacheKey)
  let buffer: Buffer
  try {
    buffer = await readFile(file)
  } catch {
    return null
  }
  try {
    const metaRaw = await readFile(`${file}.meta`, 'utf-8')
    const meta = JSON.parse(metaRaw) as { mimeType?: unknown }
    if (typeof meta.mimeType !== 'string' || meta.mimeType === '') {
      throw new Error('invalid metadata')
    }
    return { buffer, mimeType: meta.mimeType }
  } catch {
    await unlink(file).catch(() => {})
    await unlink(`${file}.meta`).catch(() => {})
    return null
  }
}

/**
 * Evicts least-recently-modified entries until the directory fits the budget.
 *
 * @param dir - Cache directory
 * @param budgetBytes - Maximum total bytes retained
 */
export const enforceDiskBudget = async (
  dir: string,
  budgetBytes: number = OPTIMIZED_DISK_BUDGET_BYTES
): Promise<void> => {
  try {
    const names = await readdir(dir)
    const entries: Array<{ name: string; size: number; mtimeMs: number }> = []
    let total = 0
    for (const name of names) {
      if (name.endsWith('.meta')) continue
      try {
        const info = await stat(join(dir, name))
        if (!info.isFile()) continue
        total += info.size
        entries.push({ name, size: info.size, mtimeMs: info.mtimeMs })
      } catch {
        continue
      }
    }
    entries.sort((a, b) => a.mtimeMs - b.mtimeMs)
    for (const entry of entries) {
      if (total <= budgetBytes) break
      await unlink(join(dir, entry.name)).catch(() => {})
      await unlink(join(dir, `${entry.name}.meta`)).catch(() => {})
      total -= entry.size
    }
  } catch (error) {
    logger.warn({ err: error, dir }, 'Optimized disk cache eviction failed')
  }
}

/**
 * Writes an optimized image to disk and enforces the byte budget.
 *
 * @param cacheKey - Pre-built cache key
 * @param image - Optimized image to cache
 * @param dir - Cache directory (defaults to {@link optimizedDiskDir})
 */
export const writeOptimizedDisk = async (
  cacheKey: string,
  image: OptimizedMedia,
  dir: string = optimizedDiskDir()
): Promise<void> => {
  try {
    await mkdir(dir, { recursive: true })
    const file = fileFor(dir, cacheKey)
    await writeFile(file, image.buffer)
    await writeFile(
      `${file}.meta`,
      JSON.stringify({ mimeType: image.mimeType }),
      'utf-8'
    )
    await enforceDiskBudget(dir)
  } catch (error) {
    logger.warn({ err: error }, 'Optimized disk cache write skipped')
  }
}
