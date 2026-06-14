/**
 * @module @domains/music/mappers/music-versions-mapper
 * @remarks Maps music version and resolution database rows into API cache payloads.
 */
import type { MusicVersion } from '@domains/music/types/music-details-types'
import type {
  MusicResolutionDB,
  MusicVersionDB,
} from '@domains/music/types/music-db-types'

/**
 * Builds version trees with nested resolutions from database rows.
 *
 * @param versions - Music version rows for a track
 * @param resolutions - Resolution rows linked by `musicVersionId`
 * @returns {@link MusicVersion}[] ready for API responses and Redis cache
 */
export const mapMusicVersions = (
  versions: MusicVersionDB[],
  resolutions: MusicResolutionDB[]
): MusicVersion[] => {
  const resolutionsByVersionId = resolutions.reduce<
    Record<number, MusicResolutionDB[]>
  >((acc, resolution) => {
    const versionId = resolution.musicVersionId
    if (!acc[versionId]) {
      acc[versionId] = []
    }
    acc[versionId].push(resolution)
    return acc
  }, {})

  return versions.map((version) => ({
    musicId: version.musicId,
    version: version.version,
    versionId: version.versionId,
    resolutions: (resolutionsByVersionId[version.versionId] ?? []).map(
      (resolution) => ({
        resolution: resolution.resolution,
        audioUrl: resolution.audioUrl ?? '',
        videoUrl: resolution.videoUrl ?? '',
        songId: resolution.songId,
      })
    ),
  }))
}
