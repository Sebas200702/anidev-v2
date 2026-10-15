## Context

Both the Fase 3 Music Player (which switches seamlessly between audio and video OP/ED resolutions from AnimeThemes) and the Fase 5 Episode Player require a deterministic playback state machine that never leaks `<video>` instances, never loses the current playback timestamp when switching quality/server, and recovers gracefully when an upstream CDN fails.

## Goals / Non-Goals

**Goals:**

- Share one compact, pure-TypeScript `PlaybackCoordinator` and serialized adapter lifecycle between the Music Player and the Episode Video Player.
- Keep all files $\le 150$ lines per unit folder (`AGENTS.md`), avoiding Tatakai's 74 KB monolithic `VideoPlayer.tsx`.
- Leverage `mal_id` (already the primary key of `anime`) to fetch and cache AniSkip timestamps and link OP/ED segments to AniDev's `music` domain.

**Non-Goals:**

- BitTorrent (`WebTorrent`), Debrid, or local loopback desktop proxies (`127.0.0.1`) — out of scope for a web SSR platform.
- Exposing any proxy secret or password in client environment variables (`PUBLIC_*`).

## Decisions

### 1. Generation-guarded `PlaybackCoordinator` and serialized `AdapterSwitchQueue`

Every call to `coordinator.begin(source, initialPosition)` flushes the previous position, aborts the previous `AbortController`, increments `this.generation`, and checks whether `source.itemId === this.currentSource?.itemId`. When the item is identical (e.g., switching from `720p` to `1080p`, switching from `Server A` to `Server B`, or toggling Audio $\leftrightarrow$ Video on an OP/ED), `startTime` defaults to the live `this.position` so playback resumes at the exact second.

### 2. Parallel candidate fast-probe (`1500 ms`) and bounded HLS recovery

When an episode has multiple `NormalizedStreamSource` entries:
1. Sources are ordered by `(audioMatch, priority ASC)`.
2. Top candidates (up to 4) are probed in parallel with `AbortSignal.timeout(1500)` (`Range: bytes=0-0` for MP4/WebM; manifest `GET` for HLS). The first 2xx/206 response wins (`firstFulfilled`).
3. `HlsController` configures `hls.js` with `lowLatencyMode: false`, `startLevel: 0`, `abrEwmaDefaultEstimate: 4_000_000`, `MAX_NETWORK_RETRIES = 2`, and `MAX_MEDIA_RETRIES = 2`. On a second media error it invokes `hls.swapAudioCodec?.()` before `recoverMediaError()`. When retries for a source are exhausted, it automatically advances to the next candidate source before surfacing an error to the UI.

### 3. AniSkip integration with negative caching and Music cross-linking

`skipSegmentsService.getSkipSegments(malId, episodeNumber)` uses `withStaleCache` in Dragonfly (`watch:skip:${malId}:${episodeNumber}`, TTL 7 days). On cache miss it calls `https://api.aniskip.com/v2/skip-times/${malId}/${episodeNumber}?types[]=op&types[]=ed&types[]=recap&episodeLength=0` with `AbortSignal.timeout(3_000)`. A `404` from AniSkip is cached as an empty array `[]` for 24 hours so missing episodes do not trigger repeated external requests. When `op` or `ed` segments exist, the service attaches the anime's OP/ED metadata from `getMusicByAnimeId(malId)` so the player overlay can display *"Opening: [Title] — Listen in Music"*.
