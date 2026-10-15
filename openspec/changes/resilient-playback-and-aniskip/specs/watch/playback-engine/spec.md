## Purpose

Provides a resilient, generation-guarded media playback engine with serialized adapter switching, continuity preservation across quality/server changes, and automatic multi-source failover.

## ADDED Requirements

### Requirement: Playback coordinator cancels stale loads and preserves same-item position

The `PlaybackCoordinator` MUST assign a monotonically increasing `generation` and a fresh `AbortSignal` to every `begin()` call, aborting any in-flight load, and MUST preserve the current playback position in seconds when switching sources, qualities, or audio/video modes within the same episode or music track.

#### Scenario: Rapidly switching episodes or tracks cancels prior loads

- **WHEN** a user selects Episode 1 and immediately selects Episode 2 before Episode 1 finishes loading
- **THEN** Episode 1's `AbortSignal` is aborted, its late events are ignored by `generation` check, and only Episode 2 attaches to the media element

#### Scenario: Switching server or resolution within the same episode preserves timestamp

- **WHEN** a user is watching Episode 3 at `425` seconds and switches from `720p` to `1080p` (or from `Server A` to `Server B`)
- **THEN** the new source lease starts at `startTime = 425` seconds

### Requirement: Progress reporting is throttled with guaranteed flush on pause or disposal

The `PlaybackCoordinator` MUST throttle periodic progress sink invocations to at least `5000 ms` intervals during continuous playback while flushing immediately when playback pauses, completes, or the coordinator is disposed.

#### Scenario: Timeupdate events during normal playback are throttled

- **WHEN** the media element emits `timeupdate` four times per second for 10 seconds
- **THEN** the progress sink is invoked at most once every 5 seconds until pause or completion

### Requirement: HLS and direct controllers fail over across candidate sources automatically

When a media source experiences fatal network errors exceeding `MAX_NETWORK_RETRIES` (2) or fails candidate probing, the playback engine MUST automatically advance to the next ranked `NormalizedStreamSource` candidate before surfacing a terminal playback error.

#### Scenario: Primary stream source fails with network error

- **WHEN** the primary stream candidate returns HTTP `502`/`404` or times out after 2 retry attempts
- **THEN** the controller unloads the failed source and loads the next candidate source at the preserved playback timestamp
