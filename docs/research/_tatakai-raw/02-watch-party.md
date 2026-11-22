# 02-watch-party

Tatakai implements Watch Party functionality primarily through a peer-to-peer (P2P) architecture, managed by the `WatchPartySession` class . This system uses WebRTC for real-time media and control communication between participants, with a PostgreSQL database backend for signaling and room state persistence .

## Sync Protocol and Drift Correction

The synchronization protocol in Tatakai is based on a "wall-clock" approach with adaptive drift correction .

### Clock Estimation
Participants maintain a `ClockEstimator` to synchronize their local time with the host's time . This estimator uses an NTP-style algorithm, preferring low Round Trip Time (RTT) measurements to calculate an offset between local and host clocks . Clock samples are exchanged via `ping` and `pong` control messages sent over WebRTC data channels .

### Playback Synchronization
The `PlaybackTimeline` class manages the playback state (position, rate, playing status) across the session . The host sends `PlaybackSnapshot` messages to all peers, which include the current playback state and an `effectiveAt` timestamp .

### Drift Correction Strategy
The `getDriftCorrection` function determines how to correct playback drift .
*   **No drift**: If the absolute drift is less than or equal to 0.05 seconds, no correction is applied .
*   **Medium drift**: If the absolute drift is between 0.05 and 0.5 seconds, the playback rate is gently adjusted (up to 3% faster or slower) to catch up or slow down .
*   **Large drift**: If the absolute drift exceeds 0.5 seconds, a hard seek to the target position is performed .

The `useWatchRoomController` hook applies this drift correction logic to the video player .

## Transport
Tatakai primarily uses WebRTC for real-time communication in P2P watch parties .

### WebRTC Data Channels
Control messages, such as `ping`, `pong`, `snapshot-request`, `playback`, and `ready` are sent over WebRTC data channels  . Media streaming can also occur directly between peers via WebRTC .

### PostgreSQL for Signaling and Fallback
PostgreSQL is used for WebRTC signaling, where `PeerSignal` messages (e.g., `hello`, `offer`, `answer`, `ice`, `bye`) are stored and retrieved . This signaling is facilitated by the `send_watch_room_p2p_signal` RPC function .
Real-time updates for chat messages, room participants, and queue changes are handled via Supabase's `postgres_changes` subscriptions, which likely use WebSockets internally . Polling is used as a safety net for chat messages to ensure all clients converge within a few seconds, in case real-time events are missed .

## Room State and Persistence

### Backend Storage
The core P2P room state is stored in the `watch_room_p2p_state` table in PostgreSQL . This includes `room_id`, `source_revision`, `media` details, `buffering_policy`, `turn_servers`, and `host_seen_at` .
General watch room information, such as `p2p_enabled`, `host_epoch`, `current_time_seconds`, and `is_playing`, is stored in the `watch_rooms` table  .

### State Management Functions
*   `get_watch_room_p2p_state`: Retrieves the P2P state for a given room .
*   `configure_watch_room_p2p`: Allows the host to configure P2P settings like `p2p_enabled`, `buffering_policy`, and `turn_servers` .
*   `publish_watch_room_p2p_media`: Used by the host to publish media details, which updates the `source_revision` and `media` fields .
*   `watch_room_p2p_heartbeat`: Hosts send heartbeats to update their `host_seen_at` and optionally their current playback position and playing status .

## Host/Guest Roles

### Host Role
The host is responsible for controlling playback (play/pause, seek) and publishing media information  . The host also sends heartbeats to the backend . Only the active room host can configure P2P settings and publish media  .

### Guest Role
Guests receive playback commands and media streams from the host . They apply drift corrections to their local player to stay synchronized . Guests also send `ping` messages to the host for clock estimation and `ready` messages to indicate their buffering status .

### Host Transfer
The `transfer_watch_room_p2p_host` RPC allows the current host to transfer their role to another participant, or for a participant to take over if the host is unresponsive . A `host_epoch` is incremented upon host transfer to invalidate old connections and commands .

## Chat and Reactions
Chat messages are stored in the `watch_room_messages` table . Real-time updates for chat are handled via `postgres_changes` subscriptions, with a fallback polling mechanism  . The system plays a notification sound for new chat messages from other users .

## Key Files and Modules

*   `src/core/watch-party/session.ts`: Defines the `WatchPartySession` class, which encapsulates the logic for P2P connections, playback control, and synchronization .
*   `src/core/watch-party/sync.ts`: Contains the `ClockEstimator`, `PlaybackTimeline`, `ReadinessBarrier`, and `getDriftCorrection` functions, which are fundamental to the synchronization protocol   .
*   `src/hooks/media/useP2PWatchRoom.ts`: A React hook that manages the lifecycle of a P2P watch room session, including fetching room state, handling signaling, and setting up media playback .
*   `src/components/watch/room/useWatchRoomController.ts`: A React hook that integrates the watch room logic, including participant sync logic and real-time subscriptions for various room events  .
*   `supabase/migrations/20261024000001_watch_room_p2p.sql`: Defines the PostgreSQL schema and functions for P2P watch room state, signaling, and host management .

## Backend Involved
The primary backend involved is a PostgreSQL database, managed through Supabase . This database stores room metadata, P2P specific state, and handles signaling for WebRTC connections via RPC functions and real-time `postgres_changes`   .

## Notes
The provided context focuses heavily on the P2P implementation of Watch Party. While there are mentions of `watch_room_messages` and `watch_room_queue` tables, the details on "reactions" are not explicitly covered in the provided snippets. The `useWatchRoom` hook also exists, but `useP2PWatchRoom` is specifically for the P2P functionality.

View this search on DeepWiki: https://deepwiki.com/search/describe-in-technical-detail-h_a552da6a-e796-44bc-aeb4-ae85d1964702

