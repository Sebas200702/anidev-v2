# watch/progress-sync Specification

## Purpose

Persists and reconciles per-episode playback progress across devices and local storage so users can resume any episode at the exact second they stopped.

## Requirements

### Requirement: Episode watch progress is persisted with newest-or-better conflict resolution

The system MUST persist `(user_id, anime_id, episode_id, episode_number, progress_seconds, duration_seconds, completed, watched_at)` and MUST resolve concurrent or sub-second writes using a `1000 ms` tolerance window that prefers the higher `progress_seconds` value on ties.

#### Scenario: Sub-second stale zero-progress write does not overwrite real progress

- **WHEN** a user has stored `progress_seconds = 600` at `T` and a second write arrives at `T + 400ms` with `progress_seconds = 0` for the same episode
- **THEN** the stored `progress_seconds` remains `600`

#### Scenario: Genuine newer seek backwards updates progress

- **WHEN** a user seeks backwards and saves `progress_seconds = 120` more than `1000 ms` after the previous `watched_at` timestamp
- **THEN** the stored `progress_seconds` updates to `120`

### Requirement: Episodes watched to at least 90 percent are marked completed

When `duration_seconds > 0` and `progress_seconds / duration_seconds >= 0.90`, the system MUST automatically mark `completed = true` for that episode record.

#### Scenario: Playback reaches 90 percent of episode duration

- **WHEN** a client reports `progressSeconds = 1300` and `durationSeconds = 1420` (`91.5%`)
- **THEN** the persisted row is saved with `completed = true`

### Requirement: Continue Watching returns at most one active episode per anime

The *Continue Watching* query MUST exclude episodes with `completed = true`, order remaining records by `watched_at DESC`, and return at most one entry per `anime_id` corresponding to the most recently watched incomplete episode.

#### Scenario: User has multiple incomplete episodes of the same anime

- **WHEN** a user has incomplete progress rows for episodes 3, 4, and 5 of the same anime where episode 5 has the latest `watched_at`
- **THEN** the *Continue Watching* response includes only episode 5 for that anime
