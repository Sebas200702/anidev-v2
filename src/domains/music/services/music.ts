import { musicRepository } from '@/domains/music/repositories/music'
import { musicVersionRepository } from '@/domains/music/repositories/music-version'
import { musicRelationRepository } from '@/domains/music/repositories/music-relation'
import { mapMusicDetail } from '@/domains/music/mappers/music-detail'
import { musicNotFound } from '@/domains/music/errors'
import { musicCache } from '@/domains/music/cache/music-cache'
import type {
  MusicResolutionDB,
  MusicVersionDB,
} from '@/domains/music/types/music-db'

import { withCache } from '@/core/cache'
import type { MusicDetails } from '@/domains/music/types/music-details'

export const musicService = {
  async getMusicDetailsById(id: number): Promise<MusicDetails> {
    return withCache({
      key: musicCache.key(id),
      getCache: () => musicCache.get(id),
      setCache: (_, value) => musicCache.set(id, value),
      compute: async () => {
        const [music, versions, relations] = await Promise.all([
          musicRepository.getMusicById(id),
          musicVersionRepository.findVersionsByMusicId(id),
          musicRelationRepository.findArtistsByMusicId(id),
        ])

        if (!music) {
          throw musicNotFound(id)
        }

        let resolutionsByVersionId: Record<number, MusicResolutionDB[]> = {}

        if (versions.length > 0) {
          const resolutionLists = await Promise.all(
            versions.map((v: MusicVersionDB) =>
              musicVersionRepository.findResolutionsByVersionId(v.versionId)
            )
          )

          resolutionsByVersionId = versions.reduce<
            Record<number, MusicResolutionDB[]>
          >(
            (
              acc: Record<number, MusicResolutionDB[]>,
              v: MusicVersionDB,
              index: number
            ): Record<number, MusicResolutionDB[]> => {
              acc[v.versionId] = resolutionLists[index]
              return acc
            },
            {}
          )
        }

        const details = mapMusicDetail({
          music,
          artists: relations,
          versions,
          resolutionsByVersionId,
        })

        return details
      },
    })
  },
}
