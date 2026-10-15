## Why

The architectural audit of `anidev-v2` (benchmarked against `Snozxyx/Tatakai`) uncovered critical security, memory-safety, cache-coherence, and database-indexing gaps that must be resolved before scaling product features in Fases 2–5:

1. **Private user data leak (`T-01`)**: `GET /api/user/:userId` (`src/domains/user/services/user/service.ts`) returns `preferences` and `history.watchedAnimes` to anonymous and non-owner callers, and `withCache` serves cached profiles before running authorization checks. Meanwhile, `userContentPolicies` (`canViewUserPreferences`, `canViewUserHistory`) are dead code.
2. **Media cache key collision & double JSON serialization (`T-02`)**: `buildRawMetaKey` and `buildRawKey` (`src/domains/media/cache/media-cache/keys.ts`) omit `version` and `resolution`, causing multi-version or multi-resolution music/episode requests to serve the wrong media asset. `writeRawMeta` also double-stringifies JSON.
3. **Full-file RAM buffering, unbounded `/tmp` writes, and missing HTTP `Range` (`206`) (`T-03`)**: `fetchRawMedia` loads entire video/audio files into a `Buffer` in RAM and writes them to `tmpdir()/media-cache` without eviction, while `/media/[...path].ts` returns `200 OK` without `Range` support (`206 Partial Content`) and `fetchMediaAsset` lacks default timeouts and SSRF guards. On the 4 vCPU / 8 GB RAM VPS (Constraint D8), concurrent streams risk OOM crashes and broken `<video>`/`<audio>` seeking.
4. **Error envelope inconsistency & `src/pages/index.astro` unhandled `InfraError` (`T-04`)**: `withZodValidation` and `/media/[...path].ts` omit `code` and `Retry-After` headers when building error responses; `mapErrorToHttp` leaks `error.details` on 503 responses; and `src/pages/index.astro` lacks a `try/catch` to render `<ServiceUnavailable />` (503) when PostgreSQL is down with a cold cache.
5. **Missing PostgreSQL B-tree/GIN indexes & unbounded `pg.Pool` (`T-05`)**: Foreign keys on media/music tables (`anime_media.anime_id`, `music_media.music_id`, etc.) and catalog filter columns (`anime.score`, `anime.year`, `anime_genre.genre_id`) have no indexes in `drizzle/0000_parallel_the_fury.sql`, `profile.user_id` lacks a `UNIQUE` index, several catalog FKs use `ON DELETE NO ACTION`, and `pg.Pool` has no connection ceiling.
6. **Layer boundary inversion (`T-06`)**: `src/shared/utils/image/normalize-media-util.ts` imports five `@media/repositories/*` modules, violating the `src/shared/` $\not\to$ `src/domains/` rule.
7. **Base64 binary images in Dragonfly & per-request session DB hits on `/media/*` (`T-07`, `T-08`, `T-09`)**: Storing base64-encoded WebP buffers in Dragonfly competes for the 512 MB RAM budget; `auth-middleware.ts` queries PostgreSQL on every `/media/*` request when a session cookie is present; `animeListService` runs `getAnimeList` and `getAnimeListCount` sequentially and ignores `anime_title_synonym`; and `.github/workflows/ci.yml` still carries legacy `TURSO_*`/`UPSTASH_*` variables in the `gate` job.

## What Changes

- **User privacy enforcement (`src/domains/user/`)**: Apply `projectUserProfileForActor` after `withCache` in `userService.getUserProfile` using `userContentPolicies.canViewUserPreferences` and `canViewUserHistory` so non-owners only receive public identity fields.
- **Media cache keys & disk LRU (`src/domains/media/cache/`)**: Include `version` and `resolution` in `buildRawMetaKey`/`buildRawKey`, remove double `JSON.stringify` in `writeRawMeta`, and move optimized image binary caching from Dragonfly base64 strings to a bounded local disk LRU cache with `Cache-Control: public, max-age=31536000, immutable`.
- **Zero-buffer HTTP `Range` streaming & SSRF guard (`src/domains/media/services/`, `src/pages/media/[...path].ts`)**: Add `assertSafeExternalUrl` (HTTPS-only, block loopback/RFC1918/link-local IPs) and default `AbortSignal.timeout(8_000)` in `fetchMediaAsset`, and stream raw episode/music media via web `ReadableStream` forwarding `Range`, `Content-Range`, `Accept-Ranges: bytes`, and `206 Partial Content`.
- **Error envelope unification & home page degradation (`src/shared/http/`, `src/shared/errors/`, `src/pages/index.astro`)**: Delegate error formatting in `withZodValidation` and `/media/[...path].ts` to `createErrorResponse`, strip `error.details` from client-visible 503 `InfraError` bodies, and wrap `src/pages/index.astro` data fetching in `try/catch` to render `<ServiceUnavailable />` with status `503`.
- **Database indexes, FK cascades, and pool bounds (`src/lib/db/`, `drizzle/`)**: Add B-tree indexes on all media/music foreign keys, catalog filter/sort columns, `uniqueIndex` on `profile.user_id`, GIN `pg_trgm` index on `anime_title_synonym.title`, `onDelete: 'cascade'` on catalog junction FKs, and explicit `max`/`idleTimeoutMillis`/`connectionTimeoutMillis` on `pg.Pool`.
- **Architectural boundary & Biome guard (`src/shared/`, `src/domains/media/`, `biome.json`)**: Move `resolveMediaAssets` into `src/domains/media/services/resolve-media-assets/` and enforce `noRestrictedImports` in `biome.json` so `src/shared/**` and `src/lib/**` cannot import domain aliases.
- **Middleware hardening & catalog search optimization (`src/middleware/`, `src/domains/anime/`, `.github/workflows/ci.yml`)**: Skip session resolution on `/media/*` and static/health routes, cache resolved sessions in Dragonfly for 60s, add `x-request-id`, security headers (CSP, `nosniff`, `DENY`), and Dragonfly-backed rate limiting, run `getAnimeList` + `getAnimeListCount` in `Promise.all`, include `anime_title_synonym` in free-text search, and update `ci.yml` env vars.

## Capabilities

### New Capabilities

- `user/profile-privacy`: Owner-only projection of private profile fields (`preferences` and `history`) across cached and uncached reads.
- `media/range-streaming-and-cache`: Zero-buffer HTTP `Range` (`206 Partial Content`) media streaming, SSRF/timeout protection on upstream fetches, version/resolution-aware cache keys, and bounded disk caching for optimized images.
- `infrastructure/security-middleware`: Request correlation (`x-request-id`), HTTP security headers (`Content-Security-Policy`, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`), Dragonfly token-bucket rate limiting, and zero-DB-hit session skipping on asset routes.

### Modified Capabilities

- `infrastructure/database`: Bounded `pg.Pool` configuration, foreign-key and filter B-tree/GIN indexes, `profile.user_id` uniqueness, and cascade rules.
- `infrastructure/error-handling`: Uniform error envelope (`code` and `Retry-After`) in validation and media routes, and sanitization of `error.details` on 503 responses.
- `frontend/error-pages`: Home page (`/`) graceful `503` degradation rendering `<ServiceUnavailable />` on `InfraError`.
- `anime/advanced-search`: Parallel execution of list and count queries and indexed `anime_title_synonym` matching.

## Impact

- **User domain**: `src/domains/user/services/user/`, `src/domains/user/mappers/user/`, `src/domains/user/schemas/`.
- **Media domain**: `src/domains/media/cache/media-cache/`, `src/domains/media/services/{fetch-raw-media,media-fetch,resolve-media,resolve-media-assets}/`, `src/pages/media/[...path].ts`, `src/shared/utils/image/`.
- **Database & Migrations**: `src/lib/db/client.ts`, `src/lib/db/schemas/*.ts`, new migration in `drizzle/`.
- **HTTP, Errors & Middleware**: `src/shared/http/with-validation.ts`, `src/shared/errors/map-error-to-http.ts`, `src/middleware/`, `src/config/public-routes.ts`.
- **Anime domain & Pages**: `src/domains/anime/services/anime-list/service.ts`, `src/domains/anime/repositories/anime-list/filters.ts`, `src/pages/index.astro`.
- **Tooling & CI**: `biome.json`, `.github/workflows/ci.yml`.
