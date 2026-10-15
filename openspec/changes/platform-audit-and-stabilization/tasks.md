# Tasks — Platform audit & stabilization

> Consolidates the superseded `foundation-hardening-and-media-streaming` (T-01…T-09)
> with the 2026-10-14 audit findings (F-xx, see `design.md` §2). TDD-first: every
> behavior task starts with its failing test. Severity order is intentional —
> do not start a later phase before its predecessor passes its gate.
>
> Already performed during planning (no task): foundation deltas/tasks moved here,
> foundation change removed, ROADMAP/ARCHITECTURE references updated, stale
> checkboxes in `home-shell-and-featured-carousel` and `component-showcase`
> corrected with evidence.

## A. OpenSpec sync & close-out

- [ ] A.1 Add the missing regression tests that keep `home-shell-and-featured-carousel` honest: service-level unit test for `getCarouselItems` (cache hit, empty-eligibility short-circuit, media/genre fan-out shape) and an E2E check that `/` renders the hero when eligible anime exist and omits it cleanly when not (its tasks 6.2/6.3).
- [ ] A.2 After F.3 lands, archive `component-showcase` (its task 8.6 defect is fixed here) and then archive `home-shell-and-featured-carousel`, syncing their deltas into `openspec/specs/`.
- [ ] A.3 Archive this change after G.4, syncing all deltas (including the new music/media/search committed specs) into `openspec/specs/`.

## B. Security & privacy (P1 → P2)

- [x] B.1 **(T-01, F-01)** Write failing tests: anonymous and non-owner reads of a populated profile return public identity only — including a cache-warm case (owner reads first) — then implement the public/owner projection in `userService.getUserProfile` using `canViewUserPreferences`/`canViewUserHistory` (no dead code left). Update `e2e/api/user-profile.spec.ts` with owner/non-owner/anonymous visibility assertions.
- [x] B.2 **(F-06)** Failing tests first: a profile row with `gender = NULL`, and non-numeric CSV preference columns, produce a valid `200` (omitted defaults), never `500 RESPONSE_VALIDATION_ERROR`; assert the invalid payload is not cached and a fixed row recovers immediately. Harden the mapper to normalize instead of casting raw strings.
- [x] B.3 **(T-08, F-02)** Dragonfly token-bucket rate-limit middleware composed in the pipeline for `/api/*` and `/media/*`: `429` + `Retry-After`, fail-open with warning when Dragonfly is down; unit tests for threshold, window reset, and cache outage.
- [x] B.4 **(F-02)** Stricter credential-abuse limits on `/api/auth/login|register`: per-IP and per-email counters, failure counting, temporary lockout/backoff, security-event log line; tests for per-account throttling regardless of source IP.
- [x] B.5 **(F-03)** Failing test first: `/showcase?component=service-unavailable&retryHref=javascript:alert(1)` must not render a `javascript:` href. Validate navigable inputs (same-origin relative path or allowlisted scheme) in showcase controls and in `ServiceUnavailable`/genre-link sinks; render inert text on failure.
- [x] B.6 **(F-21)** Auth surface hardening with tests: neutral registration outcome for existing emails, `token` removed from login/register JSON bodies, provider payloads out of `meta.details` (kept in `cause`), credential-error mapping keyed by Better Auth's stable error code so the documented `401` path is reachable.
- [x] B.7 **(F-22)** Bound request bodies in `withZodValidation`: reject `Content-Length`/streamed size over 1 MiB with `413` before `request.json()`; tests for oversized and chunked-unknown-length cases.
- [x] B.8 **(F-19, F-22)** Bound `page` (≤ `10_000`) in anime/music list schemas; tests assert `400 VALIDATION_ERROR` and that no query runs.
- [x] B.9 **(T-06, T-08, F-03, F-07)** Middleware/security header pass: `x-request-id` on every response, `nosniff`, `X-Frame-Options`/`frame-ancestors 'none'`, `Referrer-Policy`, HSTS (prod), CSP as a real HTTP header; remove `'unsafe-inline'` from `script-src` if Astro inline injections can be hashed in this version (document any residual). Add `biome.json` overrides forbidding domain imports inside `src/shared/**` and `src/lib/**`, then fix the remaining violations (move `resolveMediaAssets` out of `src/shared/utils/image/` per C.7).
- [x] B.10 **(T-04, F-09)** Error envelope unification: `withZodValidation` and `/media/[...path]` error paths use `createErrorResponse` (code + `Retry-After`); 503 bodies omit `error.details`; `/` renders `<ServiceUnavailable />` with `503` on `InfraError`; tests for each.
- [x] B.11 **(F-25)** `isPublicRoute('//…')` returns true via the `'/'` prefix; make the root route an exact match and add a unit test.

## C. Media pipeline

- [x] C.1 **(T-02)** Failing tests then implementation: `buildRawKey`/`buildRawMetaKey` include `version` and `resolution`; `writeRawMeta`/`readRawMeta` single-serialize (`RawMeta` passes straight to cache primitives).
- [x] C.2 **(T-03)** `Range`/`206` zero-buffer streaming in `fetchRawMedia` + `/media/[...path]`: forward `Range`, reply `206` with `Content-Range`/`Accept-Ranges`, stream via `ReadableStream`, and stop writing full files to `tmpdir()`; unit + route tests.
- [x] C.3 **(T-03, T-04)** `assertSafeExternalUrl` (HTTPS-only; reject credentials, loopback, RFC1918, link-local/metadata IPs) + default `AbortSignal.timeout(8_000)` in the media fetch path, revalidating redirects (`redirect: 'manual'` or post-check of `response.url`); tests for each rejected class.
- [x] C.4 **(F-04, F-10)** Byte budget while streaming (abort with typed `503`), MIME allowlist for raw media, `nosniff` + safe `Content-Disposition` on raw responses; tests with a `text/html` upstream and an oversized body.
- [x] C.5 **(T-07, F-11)** Optimized images move from Redis base64 to a bounded local disk LRU with a byte budget + `Cache-Control: public, max-age=31536000, immutable`; bound `w` to `[16, 2048]` (normalized); decide and implement the `/_image` stance (disable or document + keep `remotePatterns` empty) with a test asserting remote transforms are refused.
- [x] C.6 **(F-19/F-28 item)** Unsupported-but-parsed entities (e.g. `studio`) fail as `404/400` domain errors, not `503`; test asserts no `InfraError` alert path.
- [x] C.7 **(T-06)** Move `resolveMediaAssets` into `src/domains/media/services/resolve-media-assets/` and decouple `src/shared/utils/image/**` from every `@media/*` import; update consumers.

## D. Database & performance

- [x] D.1 **(T-05)** Configure `pg.Pool` with explicit `max`, `idleTimeoutMillis`, `connectionTimeoutMillis`; unit test for the options passed.
- [x] D.2 **(T-05)** Indexes migration: B-tree on `anime_media(anime_id, media_type)`, `character_media`, `staff_media`, `episode_media`, `music_media`, `music_version(music_id)`, `music_resolution(music_version_id)`, `episode(anime_id)`, catalog filter columns, `uniqueIndex` on `profile.user_id` (pre-flight duplicate-check query documented in the migration task), `onDelete: 'cascade'` on catalog junctions; generate with `db:generate`, verify `EXPLAIN` before/after on the real DB and record plans.
- [x] D.3 **(F-16, F-26)** Carousel hot path: set-based eligibility in SQL over indexed columns, reuse `getMediaByAnimeIds` for the media fan-out (no per-slide queries), dedicated `anime:carousel:` cache prefix; unit + integration tests; record query count before/after (13 → target ≤ 3 cold).
- [ ] D.4 **(F-17, T-09 item)** Wrap `searchHistoryRepository.record` insert+prune in `db.transaction`; concurrency test proves the cap holds.
- [x] D.5 **(F-08)** Add the missing `await` in `anime-characters:39`, `character:53`, `staff:35`, `music:86`; tests assert DB failures surface as typed `DB_ERROR` (not `UNKNOWN_ERROR`).
- [ ] D.6 **(T-09, F-19)** `animeListService` runs list+count via `Promise.all`; `buildAnimeListFilters` matches `anime_title_synonym.title` (EXISTS) with the GIN index; integration tests for synonym search + concurrency.
- [ ] D.7 **(F-18)** Make the anime-`full` stale flag reflect payload provenance: a payload assembled from degraded sub-reads reports `isStale: true` on every read (including cache hits) until recomputed; unit test covering compute + cache-hit.
- [ ] D.8 **(F-27, F-26)** Canonicalize cache keys built from structured inputs (stable field order/whitelist) so equivalent filters always hit; unit test with permuted filter objects.

## E. Observability & operations

- [ ] E.1 **(T-08, F-20)** Request-scoped logger: bind `x-request-id`, emit one structured access line per request (method, route, status, duration, actor class); tests for the line shape and correlation between access and error lines.
- [ ] E.2 **(F-20)** Redaction pass: `pino` `redact` for cookies/authorization/tokens; stop logging full payloads/headers in `withErrorHandling` (whitelist fields); disable or redact Better Auth's internal logger emails; Sentry `sendDefaultPii: false` + `beforeSend` scrubbing; tests asserting no email/token appears in emitted logs.
- [ ] E.3 **(F-20)** Version the alert rules doc (Rustrak/Sentry): 5xx rate, consecutive readiness failures, auth lockout surge, disk threshold — each with threshold, window, and first response.
- [ ] E.4 **(F-20)** Ops runbooks: backup/restore (perform one drill on the local stack and record the result), release rollback (previous image tag, additive-only migrations), incident triage via requestId; link them from `README.md`.

## F. Bundle, dependencies & build hygiene

- [ ] F.1 **(F-14)** Replace the `Toolbar` React island with a vanilla `script.ts` under the existing pattern; keep the island build path available for future features. Record before/after gzip sizes for every client chunk (budget baseline) and assert no React/ReactDOM chunk ships on pages without islands.
- [ ] F.2 **(F-14)** Monitoring SDK strategy: keep error-only capture, document `PUBLIC_SENTRY_DSN` as the on/off switch, and record its gzip cost; evaluate defer/ lazy-init; if unset-DSN still ships the SDK chunk, decide (documented) whether to gate injection.
- [ ] F.3 **(F-15)** Single-`h1` pass: demote the header brand to non-heading text, give `/` a real `h1`; verify `/`, `/showcase`, `/anime/[malId]/[slug]` each render exactly one `h1`.
- [ ] F.4 **(F-12, F-13)** Dependency upgrades with a spike for the blocker: `drizzle-orm` ≥ 0.45.4, `vitest` ≥ 4.1.11, `better-auth` ≥ 1.6.33 (run auth tests + e2e), and a timeboxed astro-7 spike that resolves the Bun self-host adapter question (options in `design.md` §3.6 — **present the outcome for approval before switching the runtime**). Record reachability analysis for anything deferred in the audit allowlist.
- [ ] F.5 **(F-23)** Build hygiene: `bun audit --audit-level=high` in the `gate` job with a reviewed allowlist file (package, advisory, reachability, tracking task); Renovate/Dependabot config for patch/minor PRs.
- [ ] F.6 **(F-23)** Packaging cleanup: move `pino-pretty`, `dotenv`, `@types/react-dom` to `devDependencies`; replace `@formkit/tempo`'s single use with `Intl.DateTimeFormat` (output test); Docker runtime stage installs runtime deps only; align Bun versions (Docker ↔ CI ↔ `engines`); remove the `db:migrate:prod` script; add `permissions: contents: read` + `persist-credentials: false` to `deploy.yml`; drop `TURSO_*`/`UPSTASH_*` placeholders from `ci.yml`; replace committed Rustrak credentials in `.env.local.example` with required-placeholder (`:?`) values.
- [ ] F.7 **(F-24)** Client budget file + CI step: record current totals and per-chunk gzip sizes; a script prints/compares the budget on `build`.

## G. Verification, release & archive

- [ ] G.1 **(F-24)** Enforce coverage thresholds in `vitest.config.ts` (statements 85, branches 82, functions 84, lines 85) and keep `test:coverage` blocking in CI.
- [ ] G.2 **(F-24, B.1)** E2E additions (real stack): owner/non-owner/anonymous profile visibility; `429` after threshold; hardening headers present on page/API/media; invalid `w`/`page` rejected; raw-media `nosniff` when a fixture source exists.
- [ ] G.3 Full local verification with the real stack up: `docker compose up -d` → `db:migrate` → `db:seed:e2e` → `format` → `check` → `check:types` → `test` → `test:integration` → `test:e2e` → `build`; re-run the audit probe script (headers, privacy, `h1` count, chunk sizes) and append before/after numbers to this change's design.
- [ ] G.4 **(F-28)** Refactor the 4 files over the 150-line rule (`carousel-item.astro` 157, `map-error-to-http.ts` 156, `app-error.ts` 156, `pages/api/user/[userId].ts` 152) by responsibility, no behavior change.
- [ ] G.5 Release on the feature branch (`bun run release:minor` — features included), open the PR, get both CI jobs green, push the tag after merge, then archive (A.3).
- [ ] G.6 Decision record: document the email-verification stance (implement in a dedicated change or declare out of scope) in `ROADMAP.md`; note the DAST/load-test follow-ups for pre-public-release.
