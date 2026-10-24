/**
 * Data access for the relational user anime list.
 *
 * @module domains/user/repositories/user-list/repository
 */
import { db } from '@db/client'
import { userAnimeList } from '@db/schemas/user-media'
import { and, desc, eq } from 'drizzle-orm'
import { dbError } from '@shared/errors/db-errors'
import type { UserListEntry } from '@user/schemas/user-list-schema'

export interface UserListRow {
  userId: string
  animeId: number
  status: string
  isFavorite: boolean
  score: number | null
  addedAt: Date
  updatedAt: Date
}

export const userListRepository = {
  async getUserList(
    userId: string,
    filters: { status?: string; isFavorite?: boolean } = {}
  ): Promise<UserListRow[]> {
    try {
      const conditions = [eq(userAnimeList.userId, userId)]
      if (filters.status)
        conditions.push(eq(userAnimeList.status, filters.status))
      if (filters.isFavorite !== undefined)
        conditions.push(eq(userAnimeList.isFavorite, filters.isFavorite))
      const rows = await db
        .select()
        .from(userAnimeList)
        .where(and(...conditions))
        .orderBy(desc(userAnimeList.updatedAt))
      return rows as UserListRow[]
    } catch (error) {
      throw dbError('[GET_USER_LIST]', { userId }, error)
    }
  },

  async upsertUserList(
    userId: string,
    entry: UserListEntry
  ): Promise<UserListRow> {
    try {
      const rows = await db
        .insert(userAnimeList)
        .values({
          userId,
          animeId: entry.animeId,
          status: entry.status,
          isFavorite: entry.isFavorite,
          score: entry.score ?? null,
        })
        .onConflictDoUpdate({
          target: [userAnimeList.userId, userAnimeList.animeId],
          set: {
            status: entry.status,
            isFavorite: entry.isFavorite,
            score: entry.score ?? null,
            updatedAt: new Date(),
          },
        })
        .returning()
      return rows[0] as UserListRow
    } catch (error) {
      throw dbError(
        '[UPSERT_USER_LIST]',
        { userId, animeId: entry.animeId },
        error
      )
    }
  },

  async deleteUserList(
    userId: string,
    animeId: number
  ): Promise<UserListRow | null> {
    try {
      const rows = await db
        .delete(userAnimeList)
        .where(
          and(
            eq(userAnimeList.userId, userId),
            eq(userAnimeList.animeId, animeId)
          )
        )
        .returning()
      return (rows[0] as UserListRow) ?? null
    } catch (error) {
      throw dbError('[DELETE_USER_LIST]', { userId, animeId }, error)
    }
  },
}
