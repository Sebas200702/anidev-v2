/**
 * Mapper for watch progress.
 *
 * @module domains/user/mappers/watch-progress/mapper
 */
import type { WatchProgressRow } from '@user/repositories/watch-progress'

export interface WatchProgressApiEntry {
  animeId: number
  episodeId: number
  episodeNumber: number
  progressSeconds: number
  durationSeconds: number | null
  completed: boolean
  watchedAt: string
  updatedAt: string
}

export const mapWatchProgressEntry = (
  row: WatchProgressRow
): WatchProgressApiEntry => ({
  animeId: row.animeId,
  episodeId: row.episodeId,
  episodeNumber: row.episodeNumber,
  progressSeconds: row.progressSeconds,
  durationSeconds: row.durationSeconds,
  completed: row.completed,
  watchedAt: row.watchedAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
})

export const mapWatchProgress = (
  rows: WatchProgressRow[]
): WatchProgressApiEntry[] => rows.map(mapWatchProgressEntry)
