/**
 * @module @domains/media/services/fetch-raw-media-service
 * @remarks Resolves and fetches raw media bytes for a semantic path with file-system caching.
 * No optimization or MIME validation is performed.
 */
import { ErrorCodes } from '@shared/errors/codes'
import { DomainError, InfraError } from '@shared/errors/app-error'
import { mediaServiceConfig } from '@domains/media/config'
import { fetchMediaAsset } from '@domains/media/services/media-fetch-service'
import { resolveMedia } from '@domains/media/services/resolve-media-service'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { createHash } from 'node:crypto'
import type {
  OptimizedMedia,
  SemanticMediaPath,
} from '@domains/media/types/media-types'

/**
 * Resolves and fetches raw media bytes for a semantic path with file-system caching.
 *
 * @remarks Pipeline: resolve asset → check fs cache → fetch bytes → cache to fs.
 * No optimization or MIME validation is performed. Throws {@link DomainError}
 * (`MEDIA_NOT_FOUND` → 404) when no asset matches the path.
 * @param params - Parsed media path segments, or `null` when invalid
 * @param overrides - Optional version/resolution overrides applied before resolution
 * @returns Raw media buffer and original MIME type
 * @throws {InfraError} When the path is invalid or fetching fails
 * @throws {DomainError} With `MEDIA_NOT_FOUND` when no asset exists for the path
 * @example
 * ```typescript
 * const raw = await fetchRawMedia(parsedPath)
 * ```
 */
export async function fetchRawMedia(
  params: SemanticMediaPath | null,
  overrides?: { version?: string; resolution?: string }
): Promise<OptimizedMedia> {
  if (!params) {
    throw new InfraError(ErrorCodes.INVALID_IMAGE_PATH, 'Invalid media path', {
      params,
    })
  }

  const mergedParams = {
    ...params,
    version: overrides?.version ?? params.version,
    resolution: overrides?.resolution ?? params.resolution,
  }

  const media = await resolveMedia(mergedParams)

  if (media.src === mediaServiceConfig.defaultPlaceholderUrl) {
    throw new DomainError(ErrorCodes.MEDIA_NOT_FOUND, 'Media not found', {
      params,
    })
  }

  const cacheKey = createHash('sha256').update(media.src).digest('hex')
  const cacheDir = join(tmpdir(), 'media-cache')
  const cacheFile = join(cacheDir, cacheKey)
  const cacheMeta = join(cacheDir, `${cacheKey}.meta`)

  const cached = await readFile(cacheFile).catch(() => null)
  if (cached) {
    const mimeType = await readFile(cacheMeta, 'utf-8').catch(() => null)
    if (mimeType) return { buffer: cached, mimeType }
  }

  const result = await fetchMediaAsset(media.src)
  await mkdir(cacheDir, { recursive: true }).catch(() => {})
  await writeFile(cacheFile, result.buffer).catch(() => {})
  await writeFile(cacheMeta, result.mimeType, 'utf-8').catch(() => {})

  return { buffer: result.buffer, mimeType: result.mimeType }
}
