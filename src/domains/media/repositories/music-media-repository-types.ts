/**
 * @module @media/repositories/music-media-repository-types
 * @remarks Parameter and asset shapes for music media repository queries.
 */
import type { MediaAsset } from '@media/types/media-types'

export interface GetMusicMediaByTypeParams {
  mediaType: string
  musicId: number
  version?: string
  resolution?: string
}

export type MusicMediaAsset = MediaAsset & { size: string }
