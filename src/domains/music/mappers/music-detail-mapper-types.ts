/**
 * @module @music/mappers/music-detail-mapper-types
 * @remarks Input shape for assembling a {@link MusicDetails} payload from
 * related music database rows.
 */
import type {
  MusicArtistDB,
  MusicDB,
  MusicResolutionDB,
  MusicVersionDB,
} from '@music/types/music-db-types'

/** Input rows required to assemble a {@link MusicDetails} payload. */
export interface MapMusicDetailInput {
  music: MusicDB
  artists: MusicArtistDB[]
  versions: MusicVersionDB[]
  resolutionsByVersionId: Record<number, MusicResolutionDB[]>
}
