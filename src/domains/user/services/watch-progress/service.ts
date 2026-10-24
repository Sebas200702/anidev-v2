/**
 * Service for watch progress reconciliation.
 *
 * @module domains/user/services/watch-progress/service
 */
import { watchProgressRepository } from '@user/repositories/watch-progress'
import {
  mapWatchProgress,
  mapWatchProgressEntry,
} from '@user/mappers/watch-progress'
import { isNewerOrBetter } from '@user/utils/is-newer-or-better'
import type { WatchProgressEntry } from '@user/schemas/watch-progress-schema'

const completionThreshold = 0.9

const computeCompleted = (entry: WatchProgressEntry): boolean => {
  if (!entry.durationSeconds || entry.durationSeconds <= 0) return false
  return entry.progressSeconds / entry.durationSeconds >= completionThreshold
}

export const watchProgressService = {
  async list(userId: string, animeId?: number) {
    const rows = await watchProgressRepository.getWatchProgress(userId)
    if (animeId) {
      return mapWatchProgress(rows.filter((r) => r.animeId === animeId))
    }
    const incomplete = rows.filter((r) => !r.completed)
    const byAnime = new Map<number, (typeof rows)[number]>()
    for (const r of incomplete.sort(
      (a, b) => b.watchedAt.getTime() - a.watchedAt.getTime()
    )) {
      if (!byAnime.has(r.animeId)) byAnime.set(r.animeId, r)
    }
    return mapWatchProgress([...byAnime.values()])
  },

  async upsert(userId: string, entry: WatchProgressEntry) {
    const existingRows = await watchProgressRepository.getWatchProgress(userId)
    const existing =
      existingRows.find((r) => r.episodeId === entry.episodeId) ?? null

    const incoming = {
      progressSeconds: entry.progressSeconds,
      updatedAt: new Date(),
    }
    const existingSnapshot = existing
      ? {
          progressSeconds: existing.progressSeconds,
          updatedAt: existing.updatedAt,
        }
      : null

    if (!isNewerOrBetter(incoming, existingSnapshot)) {
      return existing ? mapWatchProgressEntry(existing) : null
    }

    const completed = computeCompleted(entry) || (existing?.completed ?? false)
    const row = await watchProgressRepository.upsertWatchProgress(
      userId,
      entry,
      completed
    )
    return mapWatchProgressEntry(row)
  },
}
