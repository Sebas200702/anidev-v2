/**
 * Resolves music media assets from the shared versions cache.
 *
 * @module @domains/music/services/music-media-resolver
 * @remarks
 * Used by `/media/music/:id/:type` so playback URLs reuse `music:versions:{id}`
 * warmed by {@link musicService.getMusicDetailsById} or prior media requests.
 */
import type { MediaAsset } from '@domains/media/types/media-types'
import type { MusicVersion } from '@domains/music/types/music-details-types'
import { musicVersionsLoader } from '@domains/music/services/music-versions-loader'

type ResolveMusicMediaParams = {
  mediaType: string
  musicId: number
  version?: string
  resolution?: string
}

const mapVersionsToMediaAssets = (
  versions: MusicVersion[],
  { mediaType, version, resolution }: ResolveMusicMediaParams
): MediaAsset[] => {
  const srcKey = mediaType === 'video' ? 'videoUrl' : 'audioUrl'
  const assets: MediaAsset[] = []

  for (const musicVersion of versions) {
    if (version && String(musicVersion.version) !== String(version)) {
      continue
    }

    for (const item of musicVersion.resolutions) {
      const src = item[srcKey]
      if (!src) continue
      if (resolution && !item.resolution.startsWith(resolution)) continue

      assets.push({
        id: item.songId,
        mediaType,
        src,
        size: item.resolution,
      })
    }
  }

  return assets
}

export const musicMediaResolver = {
  async getMediaByEntityAndType(
    params: ResolveMusicMediaParams
  ): Promise<MediaAsset[]> {
    const versions = await musicVersionsLoader.getById(params.musicId)
    return mapVersionsToMediaAssets(versions, params)
  },
}
