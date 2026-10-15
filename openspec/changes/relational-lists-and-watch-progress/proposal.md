## Why

In `anidev-v2`, user anime lists and watch history are currently modeled only as comma-separated text columns (`favorite_animes` and `watched_animes`) on the `profile` table (`src/lib/db/schemas/profile.ts`). That representation:
- Cannot express list states (`watching`, `completed`, `plan_to_watch`, `on_hold`, `dropped`), user scores, or timestamps.
- Cannot store per-episode playback positions (`progress_seconds`, `duration_seconds`, `completed`, `watched_at`) needed for resuming playback at the exact second.
- Suffers from lost-update race conditions on concurrent writes and lacks foreign-key referential integrity against `anime.mal_id` and `episode.id`.

Studying `Snozxyx/Tatakai` (`src/hooks/user/useWatchHistory.ts`) demonstrated a battle-tested pattern for playback progress continuity: a 3-way reconciliation between synchronous `localStorage` (surviving abrupt tab closes), local client state, and PostgreSQL (`watch_progress`), governed by a deterministic `isNewerOrBetter` tie-breaker (`1000 ms` tolerance window preferring higher `progress_seconds`), automatic completion at $\ge 90\%$ duration, and single-card-per-anime collapsing for *Continue Watching*.

## What Changes

- **Relational schemas (`src/lib/db/schemas/`)**:
  - Add `user_anime_list` table keyed by `(user_id, anime_id)` with `status` (`'watching' | 'completed' | 'plan_to_watch' | 'on_hold' | 'dropped'`), `is_favorite`, `score` (1–10), and `updated_at`.
  - Add `watch_progress` table keyed by `(user_id, episode_id)` with `anime_id`, `episode_number`, `progress_seconds`, `duration_seconds`, `completed`, and `watched_at`.
- **User lists vertical slice (`src/domains/user/`)**:
  - Repositories, mappers, services, Zod schemas, and routes (`GET/PUT/DELETE /api/user/lists`) supporting atomic upsert (`ON CONFLICT DO UPDATE`), filtering by status, and optimistic UI updates with undo support.
- **Watch progress & *Continue Watching* vertical slice (`src/domains/watch/` or `src/domains/user/`)**:
  - Pure reconciliation helper `isNewerOrBetter(incoming, existing)` (`NEWEST_WINS_TOLERANCE_MS = 1000`) and automatic $\ge 90\%$ completion calculation.
  - Endpoints `GET /api/user/watch-progress` (returns collapsed *Continue Watching* rail — one entry per `anime_id` for the most recently touched incomplete episode — or episode progress for a specific anime) and `PUT /api/user/watch-progress` (idempotent conditional upsert that only overwrites when `isNewerOrBetter` holds).
  - Client-side persistence store (`@nanostores/persistent`) writing synchronously to `localStorage` on progress ticks and flushing via `navigator.sendBeacon` on `visibilitychange` / `pagehide`, plus one-shot guest-to-account migration on login.

## Capabilities

### New Capabilities

- `user/anime-lists`: Relational per-user anime lists (`watching`, `completed`, `plan_to_watch`, `on_hold`, `dropped`, `is_favorite`, `score`) with atomic upserts and optimistic undo semantics.
- `watch/progress-sync`: Per-episode second-level watch progress persistence, 3-way reconciliation (`isNewerOrBetter`), automatic $\ge 90\%$ completion, and collapsed *Continue Watching* feed.

## Impact

- **Database**: New Drizzle schema file `src/lib/db/schemas/user-media.ts` (or `user-lists.ts` + `watch-progress.ts`) and migration in `drizzle/`.
- **Domains**: New units in `src/domains/user/` (and/or `src/domains/watch/`).
- **API routes**: `src/pages/api/user/lists.ts` and `src/pages/api/user/watch-progress.ts` (all `Cache-Control: private, no-store`).
