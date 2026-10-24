/**
 * Data access for watch progress.
 *
 * @module domains/user/repositories/watch-progress/repository
 */
import { db } from '@db/client'
import { watchProgress } from '@db/schemas/user-media'
import { and, eq } from 'drizzle-orm'
import { dbError } from '@shared/errors/db-errors'
import type { WatchProgressEntry } from '@user/schemas/watch-progress-schema'

export interface WatchProgressRow {
  userId: string
  animeId: number
  episodeId: number
  episodeNumber: number
  progressSeconds: number
  durationSeconds: number | null
  completed: boolean
  watchedAt: Date
  updatedAt: Date
}

export const watchProgressRepository = {
  async getWatchProgress(userId: string): Promise<WatchProgressRow[]> {
    try {
      const rows = await db
        .select()
        .from(watchProgress)
        .where(eq(watchProgress.userId, userId))
      return rows as WatchProgressRow[]
    } catch (error) {
      throw dbError('[GET_WATCH_PROGRESS]', { userId }, error)
    }
  },

  async upsertWatchProgress(
    userId: string,
    entry: WatchProgressEntry,
    completed: boolean
  ): Promise<WatchProgressRow> {
    try {
      const rows = await db
        .insert(watchProgress)
        .values({
          userId,
          animeId: entry.animeId,
          episodeId: entry.episodeId!,
          episodeNumber: entry.episodeNumber ?? 1,
          progressSeconds: entry.progressSeconds,
          durationSeconds: entry.durationSeconds ?? null,
          completed,
          watchedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [watchProgress.userId, watchProgress.episodeId],
          set: {
            animeId: entry.animeId,
            episodeNumber: entry.episodeNumber ?? 1,
            progressSeconds: entry.progressSeconds,
            durationSeconds: entry.durationSeconds ?? null,
            completed,
            watchedAt: new Date(),
            updatedAt: new Date(),
          },
        })
        .returning()
      return rows[0] as WatchProgressRow
    } catch (error) {
      throw dbError(
        '[UPSERT_WATCH_PROGRESS]',
        { userId, animeId: entry.animeId },
        error
      )
    }
  },
}
