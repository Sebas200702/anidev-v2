/**
 * @module @domains/music/repositories/music-version-repository
 * @remarks Database access for music version and resolution records. Versions represent
 * alternate cuts of a track; resolutions hold playable audio/video URLs per version.
 */
import { db } from '@db/client'
import { musicResolution, musicVersion } from '@db/schemas/music'
import type {
  MusicVersionDB,
  MusicResolutionDB,
} from '@domains/music/types/music-db.d-types'
import { eq, inArray } from 'drizzle-orm'

/**
 * Reads music version and resolution rows.
 *
 * @remarks Unlike other repositories, these queries do not wrap errors in {@link dbError};
 * database failures propagate directly to callers.
 * @see {@link musicService.getMusicDetailsById} for resolution batching by version ID
 * @example
 * ```typescript
 * const versions = await musicVersionRepository.findVersionsByMusicId(42)
 * const resolutions = await musicVersionRepository.findResolutionsByVersionId(7)
 * ```
 */
export const musicVersionRepository = {
  /**
   * Loads all versions for a music record.
   *
   * @param musicId - Internal music identifier
   * @returns {@link MusicVersionDB} rows for the music entry
   * @throws May propagate underlying database driver errors
   * @see {@link musicVersionRepository.findResolutionsByVersionId} for nested resolutions
   * @example
   * ```typescript
   * const versions = await musicVersionRepository.findVersionsByMusicId(42)
   * ```
   */
  async findVersionsByMusicId(musicId: number): Promise<MusicVersionDB[]> {
    return db
      .select()
      .from(musicVersion)
      .where(eq(musicVersion.musicId, musicId))
  },

  /**
   * Loads resolutions for a single version.
   *
   * @param versionId - Internal version identifier
   * @returns {@link MusicResolutionDB} rows containing audio/video URLs
   * @throws May propagate underlying database driver errors
   * @see {@link mapMusicDetail} for nesting resolutions under version entries
   * @example
   * ```typescript
   * const resolutions = await musicVersionRepository.findResolutionsByVersionId(7)
   * ```
   */
  async findResolutionsByVersionId(
    versionId: number
  ): Promise<MusicResolutionDB[]> {
    return db
      .select()
      .from(musicResolution)
      .where(eq(musicResolution.musicVersionId, versionId))
  },

  /**
   * Loads resolutions for multiple versions in one query.
   *
   * @remarks Short-circuits to an empty array when `versionIds` is empty.
   * @param versionIds - Internal version identifiers
   * @returns {@link MusicResolutionDB} rows for the requested versions
   * @throws May propagate underlying database driver errors
   * @see {@link musicVersionRepository.findResolutionsByVersionId} for single-version lookup
   * @example
   * ```typescript
   * const resolutions = await musicVersionRepository.findResolutionsByVersionIds([1, 2])
   * ```
   */
  async findResolutionsByVersionIds(
    versionIds: number[]
  ): Promise<MusicResolutionDB[]> {
    if (versionIds.length === 0) return []

    return db
      .select()
      .from(musicResolution)
      .where(inArray(musicResolution.musicVersionId, versionIds))
  },
}
