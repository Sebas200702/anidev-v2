import type {
  MusicDB,
  MusicArtistDB,
  MusicResolutionDB,
  MusicVersionDB,
} from '@/domains/music/types/music-db'
import type { MusicDetails } from '@/domains/music/types/music-details'

type MapInput = {
  music: MusicDB
  artists: MusicArtistDB[]
  versions: MusicVersionDB[]
  resolutionsByVersionId: Record<number, MusicResolutionDB[]>
}

export const mapMusicDetail = ({
  music,
  artists,
  versions,
  resolutionsByVersionId,
}: MapInput): MusicDetails => {
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
