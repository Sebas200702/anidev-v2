import type { MusicDB } from '@/domains/music/types/music-db'
import { db } from '@/core/db/client'
import { eq, inArray } from 'drizzle-orm'
import { dbError } from '@/core/errors/db-errors'
import { music } from '@/core/db/schemas/music'

export const musicRepository = {
  async getMusicById(id: number): Promise<MusicDB> {
    try {
      const [result] = await db.select().from(music).where(eq(music.id, id))
      return result
    } catch (error) {
      throw dbError('getMusicById', { id }, error)
    }
  },
  async findManyByIds(ids: number[]): Promise<MusicDB[]> {
    try {
      if (ids.length === 0) return []

      return await db.select().from(music).where(inArray(music.id, ids))
    } catch (error) {
      throw dbError('findManyByIds', { ids }, error)
    }
  },

  async findByType(type: string, limit = 50): Promise<MusicDB[]> {
    try {
      return db.select().from(music).where(eq(music.type, type)).limit(limit)
    } catch (error) {
      throw dbError('findByType', { type, limit }, error)
    }
  },
}
