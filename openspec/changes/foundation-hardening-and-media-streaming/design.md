## Context

`anidev-v2` runs on a single self-hosted VPS (4 vCPU / 8 GB RAM / 100 GB SSD) with PostgreSQL 16, Dragonfly (`--maxmemory=512mb`), and Rustrak. The architectural audit identified seven concrete defects in the current baseline that affect security, memory stability, cache correctness, and query latency. This design resolves all seven while preserving existing public API contracts and vertical-slice conventions (`≤150` lines per file, unit folders behind barrels, strict Zod validation).

## Goals / Non-Goals

**Goals:**

- Eliminate the privacy leak on `GET /api/user/:userId` without disabling profile caching.
- Support native HTTP `Range` (`206 Partial Content`) streaming for music and episode media with $\mathcal{O}(1)$ RAM usage per stream and SSRF/timeout protection.
- Keep Dragonfly's 512 MB RAM dedicated to structured JSON, session caching, and rate-limit counters by moving optimized image buffers to a bounded local disk cache.
- Guarantee index-backed queries across all media lookups and catalog filters in PostgreSQL.
- Enforce the `src/shared/` $\not\to$ `src/domains/` dependency rule in Biome.

**Non-Goals:**

- Replacing the relational `profile` CSV columns (`favorite_animes`, `watched_animes`) — that is handled in `relational-lists-and-watch-progress`.
- Client-side video/music player UI or HLS adaptive playback — handled in `resilient-playback-and-aniskip`.

## Decisions

### 1. Post-cache privacy projection (`projectUserProfileForActor`)

`userService.getUserProfile` will continue caching the mapped `UserProfile` under `user:profile:${targetId}` so the cache is not fragmented per caller. Immediately after `withCache` returns, a pure function `projectUserProfileForActor(profile, { userId, targetId })` evaluates `userPolicies.canViewUserPreferences({ userId, targetId })` and `userPolicies.canViewUserHistory({ userId, targetId })`. When false (anonymous or non-owner), `preferences` and `history` are replaced with empty/redacted structures (`{ favoriteAnimes: [], favoriteGenres: [], favoriteStudios: [] }` and `{ watchedAnimes: [] }`) before returning to the route.

### 2. Web `ReadableStream` pass-through with `Range` forwarding for raw media

Instead of `Buffer.from(await response.arrayBuffer())` and writing full video/audio files to `/tmp/media-cache`, `streamRawMedia` resolves the upstream URL via `mediaCache.getRawMeta` (cached in Dragonfly with key `meta:${entityType}:${entityId}:${mediaType}:${mediaSize}:${mediaId}:v${version}:r${resolution}`), forwards the incoming `Range` request header to the upstream CDN with a default `AbortSignal.timeout(8_000)` (for initial headers), and streams `upstreamResponse.body` directly to the Astro `Response` with status `206` (or `200`) and headers `Content-Type`, `Content-Length`, `Content-Range`, `Accept-Ranges: bytes`, and `Cache-Control: public, max-age=86400`.

### 3. SSRF guard (`assertSafeExternalUrl`) on all outbound media fetches

Before `fetchMediaAsset` opens a connection, `assertSafeExternalUrl(url)` parses the URL and rejects:
- Non-HTTPS protocols (`protocol !== 'https:'`).
- Embedded credentials (`username` or `password` present).
- Hostnames matching `localhost`, `.local`, `.internal`, IPv4 loopback (`127.0.0.0/8`), RFC 1918 private ranges (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), link-local/cloud metadata (`169.254.0.0/16`), `0.0.0.0/8`, or IPv6 loopback/private (`::1`, `fc00::/7`, `fe80::/10`).

### 4. Bounded disk cache for Sharp optimized images

`src/domains/media/cache/media-cache/store.ts` stores optimized WebP/AVIF image buffers on the local filesystem under `MEDIA_CACHE_DIR` (default `join(tmpdir(), 'anidev-image-cache')`) keyed by SHA-256 of the deterministic `buildKey(params, options)`, with a companion `.meta` JSON sidecar and a bounded size cap (`MAX_IMAGE_CACHE_BYTES = 512 * 1024 * 1024`). When total size exceeds the cap, oldest files by `mtimeMs` are pruned asynchronously. `GET /media/*` image responses emit `Cache-Control: public, max-age=31536000, immutable`.

### 5. Lightweight session resolution and middleware pipeline

Using `sequence(...)` from `astro:middleware` in `src/middleware/index.ts`:
1. `requestIdMiddleware`: reads incoming `x-request-id` (if valid token) or generates `crypto.randomUUID()`, attaches `locals.requestId`, and echoes `x-request-id` on the response.
2. `securityHeadersMiddleware`: sets `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Content-Security-Policy`.
3. `rateLimitMiddleware`: applies a Dragonfly fixed-window / token-bucket limit on `/api/auth/*` (20 req/min/IP) and `/api/*` (120 req/min/IP), failing open if Dragonfly is unreachable.
4. `authMiddleware`: immediately skips DB/cache session resolution on `/media/*`, `/api/health*`, `/showcase`, and `/api/auth/{login,register}`. When a session cookie is present on other routes, caches the resolved `SessionLocals` in Dragonfly under `auth:session:${sha256(cookie)}` for `60` seconds.

### 6. Database indexing and pool bounds

- Configure `pg.Pool` in `src/lib/db/client.ts` with `max: 20`, `idleTimeoutMillis: 30_000`, and `connectionTimeoutMillis: 5_000`.
- Add Drizzle schema indexes and generate migration `0002_hardening_indexes_and_cascades.sql` for all foreign keys and filter columns.

## Risks / Trade-offs

- **Redacting vs. omitting `preferences`/`history` on non-owner profile reads**: Returning empty defaults (`favoriteAnimes: []`, `watchedAnimes: []`) when `!canViewUserPreferences` / `!canViewUserHistory` preserves the existing `userProfileSchema` shape without breaking typed clients while preventing any private data disclosure.
- **Session cache TTL (60s)**: Revoking a session via `POST /api/auth/logout` must explicitly delete the corresponding `auth:session:${sha256(cookie)}` key in Dragonfly so logout is instantaneous.
