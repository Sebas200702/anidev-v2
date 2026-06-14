/**
 * @module @domains/music/services/music-service
 * @remarks Application service for music detail reads. Coordinates metadata and version
 * caches and response assembly.
 */
import type { MusicDetails } from '@/domains/music/types/music-details-types'
import { musicNotFound } from '@domains/music/errors'
import { musicMetadataLoader } from '@domains/music/services/music-metadata-loader'
import { musicVersionsLoader } from '@domains/music/services/music-versions-loader'

export const musicService = {
  async getMusicDetailsById(id: number): Promise<MusicDetails> {
    const metadata = await musicMetadataLoader.getById(id)

    if (!metadata) {
      throw musicNotFound(id)
    }

    const versions = await musicVersionsLoader.getById(id)

    return {
      title: metadata.title,
      type: metadata.type,
      typeCode: metadata.typeCode,
      artist: metadata.artists,
      versions,
    }
  },
}
