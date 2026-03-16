import { db } from '@/core/db/client'
import { musicResolution, musicVersion } from '@/core/db/schemas/music'
import type {
  MusicVersionDB,
  MusicResolutionDB,
} from '@/domains/music/types/music-db'
import { eq, inArray } from 'drizzle-orm'

export const musicVersionRepository = {
  async findVersionsByMusicId(musicId: number): Promise<MusicVersionDB[]> {
    return db
      .select()
      .from(musicVersion)
      .where(eq(musicVersion.musicId, musicId))
  },

  async findResolutionsByVersionId(
    versionId: number
  ): Promise<MusicResolutionDB[]> {
    return db
      .select()
      .from(musicResolution)
      .where(eq(musicResolution.musicVersionId, versionId))
  },
  async findResolutionsByVersionIds(
    versionIds: number[]
  ): Promise<MusicResolutionDB[]> {
    if (versionIds.length === 0) return []
    return db
      .select()
      .from(musicResolution)
      .where(inArray(musicResolution.musicVersionId, versionIds))
  },
}
