## Purpose

Enables users to create and join synchronized Watch2Gether rooms for anime episodes and music tracks with access control, real-time playback synchronization, 3-tier drift correction, shared queues, live chat, reactions, and polls.

## ADDED Requirements

### Requirement: Users can create and join public, invite-only, or password-protected Watch2Gether rooms

The system MUST allow an authenticated user to create a Watch2Gether room with `accessType` in `{ public, invite, password }` and `maxParticipants` cap, hashing any room password server-side, automatically seating the creator as the host participant, and never exposing `password_hash` in any API response.

#### Scenario: Host creates a password-protected room

- **WHEN** an authenticated user creates a room with `accessType: 'password'` and a password
- **THEN** the room is persisted with a hashed password, the creator is added to `watch_room_participant` with `is_host = true`, and the response envelope omits `passwordHash`

#### Scenario: Participant joins a password-protected room with valid password

- **WHEN** an authenticated user submits the correct password to `POST /api/watch-rooms/:roomId/join`
- **THEN** the user is added to `watch_room_participant` and receives the room state snapshot

#### Scenario: Participant attempts to join with wrong password or when room is full

- **WHEN** a user submits an invalid password or the room has reached `max_participants`
- **THEN** the system rejects the join with `403` (invalid password) or `409` (room full) without adding a participant row

### Requirement: Host playback state synchronizes in real time via Dragonfly and 3-tier drift correction

When the room host updates playback state (`isPlaying`, `positionSeconds`, `episodeId` / `musicId`, `category`), the system MUST update the authoritative room clock in Dragonfly, broadcast the delta to room subscribers, and participants MUST reconcile local playback using the 3-tier drift algorithm: hard seek when $|\Delta t| > 2.5\text{ s}$, proportional `playbackRate` adjustment ($\pm 0.08$) when $0.35\text{ s} < |\Delta t| \le 2.5\text{ s}$, and `1.0x` when $|\Delta t| \le 0.35\text{ s}$.

#### Scenario: Participant drifts by more than 2.5 seconds

- **WHEN** a participant's local playback position differs from the live host clock by `3.2` seconds
- **THEN** `computeDriftCorrection` returns `{ kind: 'seek', targetRate: 1 }` to seek immediately to the live host timestamp

#### Scenario: Participant drifts between 0.35 and 2.5 seconds during playback

- **WHEN** a participant lags behind the playing host clock by `1.0` second
- **THEN** `computeDriftCorrection` returns `{ kind: 'rate' }` with a `targetRate` between `1.01` and `1.08` so the player catches up smoothly without seeking

#### Scenario: Non-host attempts to mutate room playback

- **WHEN** a participant who is not the room host sends `PATCH /api/watch-rooms/:roomId/playback`
- **THEN** the server responds with `403 AUTH_FORBIDDEN` and does not alter the room clock

### Requirement: Rooms support shared media queues, live chat, reactions, and polls

The system MUST allow room participants to exchange `chat` and `reaction` messages, view and manage the ordered media queue (`watch_room_queue`), and vote once per active room poll (`watch_room_poll_vote`).

#### Scenario: Participant casts a vote in an active room poll

- **WHEN** a room participant submits a vote for option index `1` on an active poll
- **THEN** the vote is recorded uniquely for `(poll_id, user_id)` and updated poll tallies are broadcast to the room

### Requirement: Inactive rooms are automatically closed and host ownership transfers on leave

The system MUST transfer `host_id` to the longest-standing active participant when the current host leaves a non-empty room, and MUST mark rooms with no participant heartbeat for more than `5` minutes as `is_active = false`.

#### Scenario: Host leaves a room with active participants

- **WHEN** the host calls `POST /api/watch-rooms/:roomId/leave` while another participant is present
- **THEN** the next participant becomes `is_host = true` and the room remains active
