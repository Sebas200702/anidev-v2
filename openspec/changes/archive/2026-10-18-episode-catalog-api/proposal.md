# Proposal: episode catalog API

## Why

The catalog already holds per-episode metadata (`episode`: number, title,
synopsis, duration, aired — 400k rows in production since the 2026-10-18
promotion), but nothing exposes it. `GET /api/anime/:malId/full` returns only
the episode *count*. The playback change (`resilient-playback-and-aniskip`)
names `GET /api/anime/:malId/episodes` in its Impact section but has no task,
spec or test for it, and its scope (streaming sources, player engine) is
blocked on the Fase 5 video-source decision. Listing episodes does not depend
on any video source, so it ships on its own.

## What Changes

- `GET /api/anime/:malId/episodes` — paginated episode list for an anime,
  ordered by episode number (`page`, `limit` ≤ 100).
- `GET /api/anime/:malId/episodes/:number` — one episode with its synopsis.
- Unknown anime → `404 ANIME_NOT_FOUND`; known anime without the requested
  episode → `404 EPISODE_NOT_FOUND` (new error code).
- Read-through Dragonfly cache with stale-serve, same as the other anime
  sub-resources.

## Capabilities

### New Capabilities

- `anime/episodes`: read-only episode catalog per anime (list + detail).

### Modified Capabilities

<!-- None. `resilient-playback-and-aniskip` keeps `/episodes/:number/sources`
and `/skip-times`; it now consumes this list instead of defining it. -->

## Impact

- `src/domains/anime/`: new `anime-episodes` repository/mapper/service/cache
  units, `anime-episode-schema.ts`, `anime-episode.d-types.ts`,
  `EpisodeNotFoundError`.
- `src/shared/errors/`: `EPISODE_NOT_FOUND` code mapped to 404.
- `src/pages/api/anime/[malId]/episodes/`: two routes (public via the
  existing `/api/anime` prefix).
- No schema change, no migration.

## Non-goals

- Episode thumbnails: `episode_media` is empty everywhere; they arrive with the
  media backfill and can be added as a nullable field later.
- Streaming sources and subtitles (`resilient-playback-and-aniskip`).
- Filler/recap flags: not in the schema.
- UI (episode list component/page): a follow-up change consumes this API.
