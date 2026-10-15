# Tasks — Foundation hardening and media streaming (Etapas 1 & 2)

## 1. User privacy enforcement (`T-01`)

- [ ] 1.1 Write failing unit tests in `src/domains/user/__tests__/services/user-reads.test.ts` asserting that anonymous and non-owner callers receive redacted `preferences` and `history` even after an owner warms `userProfileCache`.
- [ ] 1.2 Add `projectUserProfileForActor` in `src/domains/user/mappers/user/` using `userPolicies.canViewUserPreferences` and `userPolicies.canViewUserHistory`.
- [ ] 1.3 Apply `projectUserProfileForActor` after `withCache` in `userService.getUserProfile` (`src/domains/user/services/user/service.ts`).
- [ ] 1.4 Update `e2e/api/user-profile.spec.ts` to assert owner vs. non-owner/anonymous field visibility.

## 2. Media cache keys & single JSON serialization (`T-02`)

- [ ] 2.1 Write failing unit tests in `src/domains/media/__tests__/cache/media-cache-keys.test.ts` and `media-cache-store.test.ts` for `version` + `resolution` key differentiation and single-parse `RawMeta` storage.
- [ ] 2.2 Update `buildRawKey` and `buildRawMetaKey` in `src/domains/media/cache/media-cache/keys.ts` to include `:v${params.version ?? 'default'}:r${params.resolution ?? 'default'}`.
- [ ] 2.3 Remove redundant `JSON.stringify` / `JSON.parse` from `writeRawMeta` and `readRawMeta` in `src/domains/media/cache/media-cache/store.ts`.

## 3. HTTP Range (`206`) media streaming, timeouts & SSRF guard (`T-03`)

- [ ] 3.1 Write failing unit tests for `assertSafeExternalUrl` (rejecting `http:`, loopback, RFC1918, `169.254.169.254`, `::1`, credentials) and default `AbortSignal.timeout(8_000)` in `src/domains/media/__tests__/services/media-fetch.test.ts`.
- [ ] 3.2 Implement `assertSafeExternalUrl` and default timeout in `src/domains/media/services/media-fetch/`.
- [ ] 3.3 Write failing unit and route tests for `Range` streaming (`206 Partial Content`, `Content-Range`, `Accept-Ranges: bytes`, `ReadableStream` pass-through) in `src/domains/media/__tests__/services/fetch-raw-media.test.ts` and `src/pages/media/__tests__/media-route.test.ts`.
- [ ] 3.4 Refactor `fetchRawMedia` (`src/domains/media/services/fetch-raw-media/service.ts`) and `src/pages/media/[...path].ts` to stream upstream bytes via `ReadableStream` and forward `Range` headers instead of buffering full files in RAM and `/tmp/media-cache`.

## 4. Error envelope unification & home page 503 degradation (`T-04`)

- [ ] 4.1 Write failing tests in `src/shared/errors/__tests__/map-error-to-http.test.ts` and `src/shared/http/__tests__/` verifying that `InfraError` 503 responses omit `meta.details` and `withZodValidation` / `/media/[...path].ts` include `code` and `Retry-After`.
- [ ] 4.2 Update `src/shared/errors/map-error-to-http.ts` to omit `details` from client-visible `InfraError` 503 bodies.
- [ ] 4.3 Refactor `src/shared/http/with-validation.ts` and `src/pages/media/[...path].ts` error catch blocks to use `createErrorResponse(error)` and `jsonResponse`.
- [ ] 4.4 Wrap `Promise.all` in `src/pages/index.astro` with `try/catch` to set `Astro.response.status = 503` and render `<ServiceUnavailable />` when an `InfraError` is thrown.

## 5. PostgreSQL indexes, FK cascades & bounded `pg.Pool` (`T-05`)

- [ ] 5.1 Configure `new Pool({ connectionString: env.DATABASE_URL, max: 20, idleTimeoutMillis: 30_000, connectionTimeoutMillis: 5_000 })` in `src/lib/db/client.ts` and update `src/lib/db/__tests__/client.test.ts`.
- [ ] 5.2 Add missing B-tree indexes on `anime_media`, `character_media`, `staff_media`, `episode_media`, `music_media`, `music_version`, `music_resolution`, `anime`, `anime_genre`, `anime_theme`, `anime_producer`, `uniqueIndex` on `profile.userId`, and `onDelete: 'cascade'` on catalog junction FKs in `src/lib/db/schemas/*.ts`.
- [ ] 5.3 Generate Drizzle migration (`bun run db:generate`) and add the GIN `pg_trgm` index on `anime_title_synonym(title)`.

## 6. Layer boundary cleanup (`src/shared/` -> `src/domains/media/`) (`T-06`)

- [ ] 6.1 Move `resolveMediaAssets` from `src/shared/utils/image/normalize-media-util.ts` into `src/domains/media/services/resolve-media-assets/` and update imports in `src/domains/media/services/resolve-media/service.ts`.
- [ ] 6.2 Decouple `src/shared/utils/image/` helpers from `@media/*` imports so `src/shared/` has zero imports from `src/domains/`.
- [ ] 6.3 Add `overrides` in `biome.json` forbidding `@anime/*`, `@auth/*`, `@media/*`, `@music/*`, `@search/*`, `@user/*`, and `@watch/*` imports inside `src/shared/**` and `src/lib/**`.

## 7. Bounded disk image cache & immutable headers (`T-07`)

- [ ] 7.1 Write unit tests in `src/domains/media/__tests__/cache/media-cache-store.test.ts` verifying bounded disk storage and LRU eviction for optimized images instead of Redis base64 storage.
- [ ] 7.2 Update `src/domains/media/cache/media-cache/store.ts` to persist optimized image buffers on local disk with a configurable max byte budget and set `Cache-Control: public, max-age=31536000, immutable` on optimized image responses in `src/pages/media/[...path].ts`.

## 8. Security headers, rate limiting & zero-DB-hit session middleware (`T-08`)

- [ ] 8.1 Add `/anime` to `publicRoutes` in `src/config/public-routes.ts` and update `src/config/__tests__/public-routes.test.ts`.
- [ ] 8.2 Update `src/middleware/auth-middleware.ts` and `resolveAuthActor` to skip DB lookups on `/media/*`, `/api/health*`, and `/showcase`, and cache resolved sessions in Dragonfly for 60s (invalidated on `/api/auth/logout`).
- [ ] 8.3 Add `requestIdMiddleware`, `securityHeadersMiddleware` (`CSP`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`), and Dragonfly-backed `rateLimitMiddleware` composed via `sequence(...)` in `src/middleware/index.ts`.
- [ ] 8.4 Add unit tests in `src/middleware/__tests__/` covering header injection, `/media/*` session bypass, and 429 rate-limit responses.

## 9. Parallel list/count, synonym search & CI env cleanup (`T-09`)

- [ ] 9.1 Write failing unit and integration tests for `anime_title_synonym` search matching and parallel `Promise.all` execution in `src/domains/anime/__tests__/`.
- [ ] 9.2 Update `src/domains/anime/services/anime-list/service.ts` to run `getAnimeList` and `getAnimeListCount` concurrently via `Promise.all`.
- [ ] 9.3 Update `buildAnimeListFilters` in `src/domains/anime/repositories/anime-list/filters.ts` to include `EXISTS` matching against `anime_title_synonym.title`.
- [ ] 9.4 Replace legacy `TURSO_*` and `UPSTASH_*` env placeholders in `.github/workflows/ci.yml` (`gate` job) with `DATABASE_URL` and `REDIS_URL`, and wrap `searchHistoryRepository.record` in `db.transaction(...)`.
