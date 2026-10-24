/**
 * Conflict resolution for watch progress sync.
 *
 * @module domains/user/utils/is-newer-or-better/util
 */
export const NEWEST_WINS_TOLERANCE_MS = 1000

export interface WatchProgressSnapshot {
  progressSeconds: number
  updatedAt: Date
}

export const isNewerOrBetter = (
  incoming: WatchProgressSnapshot,
  existing: WatchProgressSnapshot | null
): boolean => {
  if (!existing) return true
  const delta = incoming.updatedAt.getTime() - existing.updatedAt.getTime()
  if (delta > NEWEST_WINS_TOLERANCE_MS) return true
  if (Math.abs(delta) <= NEWEST_WINS_TOLERANCE_MS) {
    return incoming.progressSeconds > existing.progressSeconds
  }
  return false
}
