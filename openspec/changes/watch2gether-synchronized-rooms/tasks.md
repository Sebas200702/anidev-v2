# Tasks — Watch2Gether synchronized rooms (Etapa 3C)

## 1. Drizzle schemas & migrations (`watch_room*`)

- [ ] 1.1 Define `watchRoom`, `watchRoomParticipant`, `watchRoomQueue`, `watchRoomMessage`, `watchRoomPoll`, and `watchRoomPollVote` in `src/lib/db/schemas/watch-room.ts` with FK cascades and indexes.
- [ ] 1.2 Export the new tables from `src/lib/db/schemas/index.ts` and generate the Drizzle migration (`bun run db:generate`).

## 2. Core drift synchronization & room policies

- [ ] 2.1 Write failing unit tests for `computeDriftCorrection` (`> 2.5s` hard seek, `0.35s–2.5s` proportional `playbackRate` within `[0.92, 1.08]`, `<= 0.35s` `1.0x`, and paused state handling).
- [ ] 2.2 Implement `src/domains/watch/core/drift-sync/` (`computeDriftCorrection` and constants).
- [ ] 2.3 Write failing unit tests for `watchRoomPolicies` (host-only playback/queue-reorder/poll-close, participant-only chat/vote, password verification without hash leakage).
- [ ] 2.4 Implement `src/domains/watch/policies/watch-room/`.

## 3. Repositories, Dragonfly realtime clock & services

- [ ] 3.1 Write failing unit and integration tests for `watchRoomRepository` (ensuring `PUBLIC_WATCH_ROOM_COLUMNS` never selects `password_hash`, atomic participant join with `max_participants` check, host transfer on leave, and 5-minute idle room reaping).
- [ ] 3.2 Implement `watchRoomRepository`, `watchRoomQueueRepository`, `watchRoomMessageRepository`, and `watchRoomPollRepository` in `src/domains/watch/repositories/`.
- [ ] 3.3 Write failing unit tests for `watchRoomRealtimeService` (Dragonfly `watch:room:{id}:clock` hash read/write and Pub/Sub event broadcasting with graceful degradation).
- [ ] 3.4 Implement `watchRoomRealtimeService` and `watchRoomService` in `src/domains/watch/services/`.

## 4. API endpoints & SSE stream

- [ ] 4.1 Add `GET /api/watch-rooms` (list public active rooms + reap idle rooms) and `POST /api/watch-rooms` (create room with hashed password and auto-seat host).
- [ ] 4.2 Add `GET /api/watch-rooms/[roomId]`, `POST /api/watch-rooms/[roomId]/join`, `POST /api/watch-rooms/[roomId]/leave`, `POST /api/watch-rooms/[roomId]/heartbeat`, and `PATCH /api/watch-rooms/[roomId]/playback`.
- [ ] 4.3 Add `GET /api/watch-rooms/[roomId]/events` (Server-Sent Events stream subscribing to room Pub/Sub events and sending initial clock snapshot).
- [ ] 4.4 Add queue, message/reaction, and poll endpoints under `src/pages/api/watch-rooms/[roomId]/`.

## 5. Watch2Gether Theater UI, showcase & E2E verification

- [ ] 5.1 Build presentational lobby cards and theater layout components (`WatchRoomCard`, `WatchRoomTopBar`, `WatchRoomDrawer` with `chat` / `queue` / `polls` / `viewers` tabs) and register them in `/showcase`.
- [ ] 5.2 Build the `<WatchRoomTheater />` island wiring `PlaybackCoordinator`, `computeDriftCorrection`, and the SSE event stream, and mount `/watch-rooms` and `/watch-rooms/[roomId]` page routes.
- [ ] 5.3 Add Playwright E2E tests verifying room creation, password-protected join, host playback sync, and chat/poll updates.
