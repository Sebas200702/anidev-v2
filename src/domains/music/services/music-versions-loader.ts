/**
 * Read-through loader for cached music versions and resolutions.
 *
 * @module @domains/music/services/music-versions-loader
 */
import { musicVersionsCache } from '@domains/music/cache/music-versions-cache'
import { mapMusicVersions } from '@domains/music/mappers/music-versions-mapper'
import { musicVersionRepository } from '@domains/music/repositories/music-version-repository'
import type { MusicVersion } from '@domains/music/types/music-details-types'
import { withCache } from '@lib/cache'

const loadVersionsFromDb = async (musicId: number): Promise<MusicVersion[]> => {
  const versions = await musicVersionRepository.findVersionsByMusicId(musicId)

  if (versions.length === 0) return []

  const versionIds = versions.map((version) => version.versionId)
  const resolutions =
    await musicVersionRepository.findResolutionsByVersionIds(versionIds)

  return mapMusicVersions(versions, resolutions)
}

export const musicVersionsLoader = {
  async getById(musicId: number): Promise<MusicVersion[]> {
    return withCache({
      key: musicVersionsCache.key(musicId),
      getCache: () => musicVersionsCache.get(musicId),
      setCache: (_, value) => musicVersionsCache.set(musicId, value),
      compute: () => loadVersionsFromDb(musicId),
    })
  },
}
