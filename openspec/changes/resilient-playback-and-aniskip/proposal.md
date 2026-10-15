## Why

In `anidev-v2`, `episode_source` (`src/lib/db/schemas/episode.ts`) only stores `(id, episode_id, src)`, lacking provider identity, stream format (`hls` vs `mp4`/`webm`), quality (`1080p`, `720p`, `auto`), audio variant (`sub` vs `dub`), required upstream headers (`Referer`, `User-Agent`), and priority. Furthermore, neither Fase 3 (Persistent Music/Video Player) nor Fase 5 (Episode Streaming Player) has a playback state coordinator or failover mechanism yet.

In `Snozxyx/Tatakai`, `PlaybackCoordinator.ts`, `SourceAdapterRegistry.ts`, `HlsAdapter.ts`, and `stream-resolver.ts` solve the hardest client-side streaming problems:
- Cancelling stale loads via a monotonic `generation` counter and `AbortController` (`PlaybackLease`) when a user switches tracks, servers, or episodes rapidly.
- Preserving exact `currentTime` (`sameEpisode` / same-track continuity) when switching quality, server, or Audio $\leftrightarrow$ Video mode.
- Probing candidate URLs in parallel (`1500 ms` timeout via `firstFulfilled`) so a dead server or wrong `Referer` fails over in ~1.5 seconds instead of stalling for 30 seconds.
- Bounded fatal network/media retries (`MAX_NETWORK_RETRIES = 2`, `MAX_MEDIA_RETRIES = 2`, resetting on `FRAG_BUFFERED`, swapping audio codec on second media error, and advancing automatically to the next candidate source).
- Merging intro/outro skip segments from AniSkip (`malId` + `episodeNumber`) with catalog metadata.

## What Changes

- **Enriched `episode_source` & `episode_subtitle` schema (`src/lib/db/schemas/episode.ts`)**:
  - Add `provider`, `server_name`, `format` (`'hls' | 'mp4' | 'webm'`), `quality`, `audio` (`'sub' | 'dub' | 'raw'`), `headers` (`jsonb`), and `priority` to `episode_source`.
  - Add `label`, `format` (`'vtt' | 'ass' | 'srt'`), and `is_default` to `episode_subtitle`.
- **Shared playback core (`src/domains/watch/core/` or `src/shared/player/`)**:
  - `PlaybackCoordinator`: manages `PlaybackLease` (`generation`, `AbortSignal`, `startTime`), preserves `position` across quality/server/mode switches for the same media item, and throttles progress sink reports to `5000 ms` (with immediate flush on pause/dispose/completion).
  - `SourceAdapterRegistry` & `HlsController` / `DirectController`: serializes `<video>`/`<audio>` load/unload operations on a single `pending` promise chain, runs parallel candidate probing (`1500 ms`), and executes bounded retry + candidate failover.
- **AniSkip & Music OP/ED cross-linking (`src/domains/watch/services/skip-segments/`)**:
  - Service querying AniSkip (`https://api.aniskip.com/v2/skip-times/{malId}/{episodeNumber}`) with a `3000 ms` timeout and Dragonfly caching (`TTL: 7 days`, negative cache `1 day` on 404), enriched with matching OP/ED track metadata from `getMusicByAnimeId(malId)` so the player can both skip the opening and link to the song in AniDev Music.

## Capabilities

### New Capabilities

- `watch/playback-engine`: Generation-guarded playback coordination (`PlaybackCoordinator`), serialized adapter switching, parallel candidate fast-probing, bounded HLS/direct error recovery, and enriched episode source contracts.
- `watch/skip-segments`: Intro/outro/recap skip segment resolution via AniSkip cached in Dragonfly and cross-linked with the anime's OP/ED music catalog.

## Impact

- **Database**: Additive columns on `episode_source` and `episode_subtitle` in `src/lib/db/schemas/episode.ts` + migration in `drizzle/`.
- **Playback engine**: Reusable across the Fase 3 `<PersistentMusicPlayer />` (`transition:persist`) and Fase 5 `<EpisodeVideoPlayer />`.
- **API routes**: `GET /api/anime/:malId/episodes`, `GET /api/anime/:malId/episodes/:number/sources`, and `GET /api/anime/:malId/episodes/:number/skip-times`.
