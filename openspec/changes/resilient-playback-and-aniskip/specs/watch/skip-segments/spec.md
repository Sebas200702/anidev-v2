## Purpose

Resolves and caches intro, outro, and recap skip timestamps per episode and links them with the anime's opening and ending music catalog.

## ADDED Requirements

### Requirement: Episode skip segments are resolved, cached, and degrade gracefully

The system MUST resolve `op`, `ed`, and `recap` time intervals for `(malId, episodeNumber)` with read-through caching in Dragonfly, caching empty results on upstream `404` and degrading to an empty list `[]` if the upstream AniSkip API times out or fails.

#### Scenario: AniSkip returns OP and ED intervals

- **WHEN** a client requests `GET /api/anime/5114/episodes/1/skip-times` and segments exist
- **THEN** the response returns normalized `{ type, startTimeSeconds, endTimeSeconds }` intervals cached in Dragonfly

#### Scenario: Upstream AniSkip returns 404 or times out

- **WHEN** AniSkip has no timestamps (`404`) or fails to respond within `3000 ms`
- **THEN** the endpoint returns `200` with `data: []` in the standard envelope without failing episode playback
