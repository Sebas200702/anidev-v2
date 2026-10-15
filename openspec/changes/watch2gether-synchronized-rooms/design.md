## Context

Watch2Gether is a flagship social-streaming feature of AniDev v2. Users want to host watch parties for anime episodes (Fase 5) as well as OP/ED listening/watching parties (Fase 3) with friends. Because AniDev v2 runs on a single 4 vCPU / 8 GB RAM VPS with Bun, PostgreSQL, and Dragonfly, the realtime synchronization design must achieve sub-second accuracy (96%+ two-way sync like Tatakai) without hammering PostgreSQL on every playback tick.

## Goals / Non-Goals

**Goals:**

- Support both `anime` episode rooms and `music` OP/ED rooms under a unified Watch2Gether domain model.
- Achieve smooth, stutter-free synchronization across participants using Tatakai's 3-tier drift correction algorithm (`> 2.5s` seek, `0.35s–2.5s` proportional `playbackRate` $\pm 0.08$, `<= 0.35s` `1.0x`).
- Protect password-gated rooms with server-side password hashing (never exposing `passwordHash` in any SQL projection or API response).
- Offload high-frequency playback ticks and heartbeats to Dragonfly (`HSET` + `PUBLISH`) and SSE (`ReadableStream`), keeping PostgreSQL writes limited to room lifecycle, queue mutations, chat messages, and polls.

**Non-Goals:**

- Peer-to-peer WebRTC video relaying or requiring hosts to install `cloudflared` on their machines — AniDev streams catalog media from its own server/CDN pipeline so every participant loads the stream directly without host upload bandwidth constraints.

## Decisions

### 1. Split persistence: PostgreSQL for room entities, Dragonfly for live playback clock & Pub/Sub

- **PostgreSQL (`watch_room`, `watch_room_participant`, `watch_room_queue`, `watch_room_message`, `watch_room_poll`, `watch_room_poll_vote`)**: Stores durable state. `watchRoomRepository` uses an explicit column selection (`PUBLIC_WATCH_ROOM_COLUMNS`) that strictly excludes `passwordHash`.
- **Dragonfly (`watch:room:{roomId}:clock` + Pub/Sub `watch:room:{roomId}:events`)**:
  - When the host plays, pauses, seeks, or changes episode/track (`PATCH /api/watch-rooms/:roomId/playback`), the server updates the Dragonfly hash `{ isPlaying, positionSeconds, updatedAtMs: Date.now(), mediaId, episodeId, category }` (TTL 6 hours) and publishes a `playback_sync` event on `watch:room:{roomId}:events`.
  - Connected participants receive the event immediately over `GET /api/watch-rooms/:roomId/events` (`text/event-stream` SSE with a dedicated subscriber Redis client multiplexed per room).

### 2. Three-tier drift correction (`computeDriftCorrection`)

```ts
export interface RoomClockSnapshot {
  readonly isPlaying: boolean
  readonly positionSeconds: number
  readonly updatedAtMs: number
}

export type DriftAction =
  | { readonly kind: 'none'; readonly driftSeconds: number; readonly targetRate: 1 }
  | { readonly kind: 'rate'; readonly driftSeconds: number; readonly targetRate: number }
  | { readonly kind: 'seek'; readonly driftSeconds: number; readonly targetTimeSeconds: number; readonly targetRate: 1 }

export const DRIFT_HARD_SEEK_THRESHOLD_S = 2.5
export const DRIFT_SOFT_RATE_THRESHOLD_S = 0.35
export const DRIFT_MAX_RATE_DELTA = 0.08

export const computeDriftCorrection = (
  participantTimeSeconds: number,
  clock: RoomClockSnapshot,
  nowMs: number
): DriftAction => {
  const elapsedSeconds = clock.isPlaying
    ? Math.max(0, (nowMs - clock.updatedAtMs) / 1000)
    : 0
  const liveHostTime = clock.positionSeconds + elapsedSeconds
  const driftSeconds = liveHostTime - participantTimeSeconds
  const absDrift = Math.abs(driftSeconds)

  if (absDrift > DRIFT_HARD_SEEK_THRESHOLD_S) {
    return {
      kind: 'seek',
      driftSeconds,
      targetTimeSeconds: liveHostTime,
      targetRate: 1,
    }
  }

  if (clock.isPlaying && absDrift > DRIFT_SOFT_RATE_THRESHOLD_S) {
    const direction = driftSeconds > 0 ? 1 : -1
    const scale = Math.min(1, absDrift / DRIFT_HARD_SEEK_THRESHOLD_S)
    const rateDelta = Number((direction * DRIFT_MAX_RATE_DELTA * scale).toFixed(3))
    return {
      kind: 'rate',
      driftSeconds,
      targetRate: Number((1 + rateDelta).toFixed(3)),
    }
  }

  return { kind: 'none', driftSeconds, targetRate: 1 }
}
```

### 3. Idle room reaping and host transfer

- Participants send a lightweight heartbeat every `25` seconds (`POST /api/watch-rooms/:roomId/heartbeat`).
- If the host leaves explicitly (`POST /api/watch-rooms/:roomId/leave`), ownership transfers automatically to the earliest-joined active participant, or the room closes if empty.
- Public room listing (`GET /api/watch-rooms`) opportunistically reaps rooms with no heartbeat in the last `5` minutes (`closeInactiveWatchRooms`).
