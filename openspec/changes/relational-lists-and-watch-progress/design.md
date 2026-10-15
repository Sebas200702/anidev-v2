## Context

ROADMAP Fase 2 requires user anime lists (*To Watch / Watching / Completed / Collection* with optimistic add/remove + undo) and Fase 5 requires exact cross-device progress resumption (*Continuar viendo*). In addition, Fase 4 (AI Recommendations) depends on structured signals from both tables.

## Goals / Non-Goals

**Goals:**

- Replace CSV list/history storage with normalized, FK-enforced PostgreSQL tables (`user_anime_list` and `watch_progress`).
- Prevent stale zero-progress writes or out-of-order network requests from overwriting further playback progress using `isNewerOrBetter`.
- Guarantee zero lost progress on abrupt tab closure via synchronous `localStorage` mirroring and `navigator.sendBeacon`.

**Non-Goals:**

- External OAuth list synchronization with MyAnimeList/AniList (planned as a follow-up adapter once `user_anime_list` is live).
- Video player rendering components (covered in `resilient-playback-and-aniskip`).

## Decisions

### 1. Deterministic conflict resolution (`isNewerOrBetter`)

Adapted from Tatakai's `src/hooks/user/useWatchHistory.ts`:
```ts
export const NEWEST_WINS_TOLERANCE_MS = 1000

export const isNewerOrBetter = (
  incoming: { progressSeconds: number; watchedAt: Date | string },
  existing: { progressSeconds: number; watchedAt: Date | string }
): boolean => {
  const delta =
    new Date(incoming.watchedAt).getTime() -
    new Date(existing.watchedAt).getTime()
  if (delta > NEWEST_WINS_TOLERANCE_MS) return true
  if (delta < -NEWEST_WINS_TOLERANCE_MS) return false
  return incoming.progressSeconds > existing.progressSeconds
}
```
Both the client merger and the PostgreSQL `ON CONFLICT (user_id, episode_id) DO UPDATE` clause enforce this invariant so a late-arriving `progressSeconds = 0` request within 1 second of a real save never clobbers the user's position.

### 2. Automatic 90% completion threshold and per-anime collapsing

When `durationSeconds > 0 && progressSeconds / durationSeconds >= 0.9`, the service marks `completed = true`. When building the *Continue Watching* rail (`GET /api/user/watch-progress?mode=continue`), completed episodes are excluded, remaining rows are ordered by `watched_at DESC`, and `DISTINCT ON (anime_id)` (or in-memory map preserving order) collapses multiple episodes of the same series into a single card representing the most recently watched episode.

### 3. Backward-compatible `mapUserProfile` bridge

While `profile.favorite_animes` and `profile.watched_animes` remain in the table during transition, `userService` can populate `preferences.favoriteAnimes` and `history.watchedAnimes` from `user_anime_list` (`is_favorite = true`) and `watch_progress` (`completed = true`) so existing profile consumers need zero breaking changes.
