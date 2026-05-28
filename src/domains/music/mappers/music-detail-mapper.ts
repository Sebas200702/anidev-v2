/**
 * @module @domains/music/mappers/music-detail-mapper
 * @remarks Maps music database rows into API-facing {@link MusicDetails} payloads, including
 * artist credits, version metadata, and nested playable resolutions.
 */
import type {
  MusicDB,
  MusicArtistDB,
  MusicResolutionDB,
  MusicVersionDB,
} from '@domains/music/types/music-db.d-types'
import type { MusicDetails } from '@domains/music/types/music-details.d-types'

/** Input rows required to assemble a {@link MusicDetails} payload. */
type MapMusicDetailInput = {
  music: MusicDB
  artists: MusicArtistDB[]
  versions: MusicVersionDB[]
  resolutionsByVersionId: Record<number, MusicResolutionDB[]>
}

/**
 * Builds a music detail object from related database records.
 *
 * @remarks Normalizes the database `type` column (`OP`, `ED`, `UNK`) into both a machine
 * `typeCode` and a human-readable `type` label (`opening`, `ending`, `unknown`). Unknown
 * or missing type values fall back to `UNK` / `unknown`.
 * @param input - Core music row plus artists, versions, and resolutions grouped by version ID
 * @returns Normalized {@link MusicDetails} payload ready for API responses and caching
 * @throws Does not throw; applies safe defaults for missing nullable fields
 * @see {@link MusicDetails} for the output shape
 * @see {@link musicService.getMusicDetailsById} for the orchestration entry point
 * @example
 * ```typescript
 * const details = mapMusicDetail({
 *   music,
 *   artists,
 *   versions,
 *   resolutionsByVersionId,
 * })
 *
 * console.log(details.type) // "opening" | "ending" | "unknown"
 * console.log(details.versions[0]?.resolutions[0]?.audioUrl)
 * ```
 */
export const mapMusicDetail = ({
  music,
  artists,
  versions,
  resolutionsByVersionId,
}: MapMusicDetailInput): MusicDetails => {
  const typeCode: MusicDetails['typeCode'] =
    music.type === 'OP' || music.type === 'ED' || music.type === 'UNK'
      ? music.type
      : 'UNK'

  let type: MusicDetails['type'] = 'unknown'
  if (typeCode === 'OP') type = 'opening'
  else if (typeCode === 'ED') type = 'ending'

  return {
    title: music.title ?? 'Unknown Title',
    type,
    typeCode,
    artist: artists.map((artist) => ({
      malId: artist.malId ?? 0,
      name: artist.name ?? 'Unknown Artist',
    })),
    versions: versions.map((version) => {
      const resList = resolutionsByVersionId[version.versionId] ?? []

      return {
        id: version.id,
        musicId: version.musicId,
        version: version.version,
        versionId: version.versionId,
        resolutions: resList.map((r) => ({
          id: r.id,
          audioUrl: r.audioUrl ?? '',
          videoUrl: r.videoUrl ?? '',
          resolution: r.resolution,
          songId: r.songId,
        })),
      }
    }),
  }
}
