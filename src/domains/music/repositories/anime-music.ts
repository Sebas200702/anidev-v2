import { db } from '@/core/db/client'
import { animeMusic } from '@/core/db/schemas/anime-relations'
import { music } from '@/core/db/schemas/music'
import { eq } from 'drizzle-orm'
import type { MusicDB } from '@/domains/music/types/music-db'


export const animeMusicRepository = {
  async findMusicByAnimeId(animeId: number): Promise<MusicDB[]> {
    const rows = await db
      .select({
        id: music.id,
        title: music.title,
        type: music.type,
      })
      .from(animeMusic)
      .innerJoin(music, eq(animeMusic.musicId, music.id))
      .where(eq(animeMusic.animeId, animeId))

    return rows
  },
}
