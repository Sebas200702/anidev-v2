## Why

**Watch2Gether (Synchronized Watch & Listening Rooms)** is a core, non-negotiable product feature for AniDev v2: users must be able to create or join public, invite-only, or password-protected rooms to watch anime episodes or listen to OP/ED music playlists together in real time with synchronized playback, shared queues, live chat, reactions, and polls.

Studying `Snozxyx/Tatakai` (`src/hooks/media/useWatchRoom.ts` and `src/components/watch/room/useWatchRoomController.ts`) revealed both what works brilliantly and what must be improved for AniDev v2's self-hosted 4 vCPU / 8 GB RAM VPS stack:
- **What to adopt from Tatakai**:
  1. **Three-tier drift correction algorithm**:
     - Large drift ($|\Delta t| > 2.5\text{ s}$): immediate hard seek (`video.currentTime = liveHostTime`).
     - Medium drift ($0.35\text{ s} < |\Delta t| \le 2.5\text{ s}$): smooth proportional `playbackRate` adjustment ($\pm 0.08$, bounded to `[0.92, 1.08]`) to catch up or slow down without audio/video stutter.
     - Small drift ($|\Delta t| \le 0.35\text{ s}$): reset `playbackRate = 1.0`.
  2. **Security & access model**: `public`, `invite`, and `password` rooms where `password_hash` is verified server-side and **never** selected or returned to clients (`WATCH_ROOM_COLUMNS` pattern), capacity enforcement (`max_participants`), participant readiness (`is_ready`), automatic host self-join, and idle room reaping (`> 5 min` without host/participant heartbeat).
  3. **Rich theater UX**: Side-rail drawer with 4 tabs (`chat`, `queue`, `polls`, `viewers`), emoji reactions, and synchronized countdown timer.
- **How AniDev v2 improves on Tatakai's architecture**:
  - Tatakai writes every playback tick (`current_time_seconds`, `is_playing`) directly to PostgreSQL (`watch_rooms`) and relies on Supabase Realtime table-change broadcasts that force every client to invalidate TanStack Query caches and re-query PostgreSQL.
  - In **AniDev v2**, durable room metadata, participants, queue, chat history, and polls live in **PostgreSQL**, while **high-frequency playback clock state (`isPlaying`, `positionSeconds`, `serverTimestampMs`, `mediaItemId`), participant heartbeats, and live event fan-out run over Dragonfly (`watch:room:{roomId}:clock` Hash + Redis Pub/Sub) delivered via Server-Sent Events (`GET /api/watch-rooms/:roomId/events`) or Bun WebSockets**. This eliminates PostgreSQL write amplification on playback ticks and requires zero client-side Cloudflare tunnels (`cloudflared`) because all media streams come from AniDev's server-side catalog (`anime` episodes and `music` OP/ED tracks).

## What Changes

- **Database schemas (`src/lib/db/schemas/watch-room.ts`)**:
  - `watch_room`: `id`, `name`, `host_id`, `scope` (`'anime' | 'music'`), `anime_id`, `episode_id`, `music_id`, `category` (`'sub' | 'dub'`), `access_type` (`'public' | 'invite' | 'password'`), `password_hash` (excluded from public projections), `is_active`, `max_participants`, `created_at`, `updated_at`, `expires_at`.
  - `watch_room_participant`: `(room_id, user_id)` unique, `display_name`, `avatar_url`, `is_host`, `is_ready`, `joined_at`, `last_seen_at`.
  - `watch_room_queue`: `id`, `room_id`, `scope`, `anime_id`, `episode_id`, `music_id`, `title`, `poster_url`, `added_by`, `position`, `created_at`.
  - `watch_room_message`: `id`, `room_id`, `user_id`, `display_name`, `avatar_url`, `message`, `message_type` (`'chat' | 'system' | 'reaction'`), `created_at`.
  - `watch_room_poll` & `watch_room_poll_vote`: live room polls with option voting and one-vote-per-user constraint.
- **Realtime clock & fan-out engine (`src/domains/watch/services/watch-room-realtime/`)**:
  - Stores authoritative room clock in Dragonfly (`watch:room:{roomId}:clock`: `{ isPlaying, positionSeconds, updatedAtServerMs, episodeId, musicId, category }`) and publishes state deltas, chat messages, reactions, queue updates, and poll updates over Dragonfly Pub/Sub channel `watch:room:{roomId}:events`.
  - Periodic checkpointing (only on play/pause/episode-switch or room close) to PostgreSQL.
- **Drift synchronizer & Theater UI (`src/domains/watch/core/drift-sync.ts`, `src/domains/watch/components/watch-room/`)**:
  - Pure `computeDriftCorrection(participantTime, clockSnapshot, nowServerMs)` implementing the 3-tier algorithm ($>2.5\text{ s}$ seek, $0.35\text{–}2.5\text{ s}$ `playbackRate` $\pm 0.08$, $\le 0.35\text{ s}$ `1.0x`).
  - SSR lobby (`/watch-rooms`) and room page (`/watch-rooms/[roomId]`) with the `<WatchRoomTheater />` island connected to `PlaybackCoordinator`.

## Capabilities

### New Capabilities

- `watch/watch2gether-rooms`: Synchronized Watch2Gether rooms for anime episodes and music tracks with public/invite/password access control, Dragonfly realtime clock & Pub/Sub fan-out, 3-tier client drift correction, shared queue, live chat/reactions, and polls.

## Impact

- **Database**: New schema `src/lib/db/schemas/watch-room.ts` and migration in `drizzle/`.
- **Cache / Realtime**: Dragonfly Hashes (`watch:room:{id}:clock`) and Pub/Sub (`watch:room:{id}:events`).
- **Routes**: `/watch-rooms`, `/watch-rooms/[roomId]`, `GET/POST /api/watch-rooms`, `POST /api/watch-rooms/:roomId/join`, `PATCH /api/watch-rooms/:roomId/playback`, `GET /api/watch-rooms/:roomId/events` (SSE), plus queue/chat/poll endpoints.
