/**
 * @module @domains/music/mappers/music-metadata-mapper
 * @remarks Maps music database rows into stable {@link MusicMetadata} cache payloads.
 */
import type { MusicMetadata } from '@domains/music/types/music-metadata-types'
import type { MusicArtistDB, MusicDB } from '@domains/music/types/music-db-types'

type MapMusicMetadataInput = {
  music: MusicDB
  artists: MusicArtistDB[]
}

const normalizeMusicType = (
  dbType: string | null
): Pick<MusicMetadata, 'type' | 'typeCode'> => {
  const typeCode: MusicMetadata['typeCode'] =
    dbType === 'OP' || dbType === 'ED' || dbType === 'UNK' ? dbType : 'UNK'

  let type: MusicMetadata['type'] = 'unknown'
  if (typeCode === 'OP') type = 'opening'
  else if (typeCode === 'ED') type = 'ending'

  return { type, typeCode }
}

/**
 * Builds stable metadata for cache storage and API reuse.
 *
 * @param input - Core music row plus credited artists
 * @returns {@link MusicMetadata} without versions or resolutions
 */
export const mapMusicMetadata = ({
  music,
  artists,
}: MapMusicMetadataInput): MusicMetadata => {
  const { type, typeCode } = normalizeMusicType(music.type)

  return {
    id: music.id,
    title: music.title ?? 'Unknown Title',
    type,
    typeCode,
    artists: artists.map((artist) => ({
      malId: artist.malId ?? 0,
      name: artist.name ?? 'Unknown Artist',
    })),
  }
}
