/**
 * Read-through loader for cached music metadata.
 *
 * @module @domains/music/services/music-metadata-loader
 */
import { musicMetadataCache } from '@domains/music/cache/music-metadata-cache'
import { mapMusicMetadata } from '@domains/music/mappers/music-metadata-mapper'
import { musicRelationRepository } from '@domains/music/repositories/music-relation-repository'
import { musicRepository } from '@domains/music/repositories/music-repository'
import type { MusicArtistDB } from '@domains/music/types/music-db-types'
import type { MusicMetadata } from '@domains/music/types/music-metadata-types'

const groupArtistsByMusicId = (
  artists: Array<MusicArtistDB & { musicId: number }>
): Record<number, MusicArtistDB[]> => {
  return artists.reduce<Record<number, MusicArtistDB[]>>((acc, row) => {
    const { musicId, ...artist } = row
    if (!acc[musicId]) {
      acc[musicId] = []
    }
    acc[musicId].push(artist)
    return acc
  }, {})
}

const loadMetadataFromDb = async (id: number): Promise<MusicMetadata | null> => {
  const [music, artists] = await Promise.all([
    musicRepository.getMusicById(id),
    musicRelationRepository.findArtistsByMusicId(id),
  ])

  if (!music) return null

  return mapMusicMetadata({ music, artists })
}

export const musicMetadataLoader = {
  async getById(id: number): Promise<MusicMetadata | null> {
    const cached = await musicMetadataCache.get(id)
    if (cached) return cached

    const metadata = await loadMetadataFromDb(id)
    if (metadata) {
      await musicMetadataCache.set(id, metadata)
    }

    return metadata
  },

  async getByIds(ids: number[]): Promise<Map<number, MusicMetadata>> {
    if (ids.length === 0) return new Map()

    const cached = await musicMetadataCache.getMany(ids)
    const missingIds = ids.filter((id) => !cached.has(id))

    if (missingIds.length === 0) return cached

    const [musicRows, artistRows] = await Promise.all([
      musicRepository.findManyByIds(missingIds),
      musicRelationRepository.findArtistsByMusicIds(missingIds),
    ])

    const artistsByMusicId = groupArtistsByMusicId(artistRows)

    await Promise.all(
      musicRows.map(async (music) => {
        const metadata = mapMusicMetadata({
          music,
          artists: artistsByMusicId[music.id] ?? [],
        })
        cached.set(music.id, metadata)
        await musicMetadataCache.set(music.id, metadata)
      })
    )

    return cached
  },
}
